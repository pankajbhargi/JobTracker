from constructs import Construct
from aws_cdk import (
    Duration,
    CfnOutput,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_cognito as cognito,
    aws_lambda_python_alpha as lambda_python
)


class ApplicationsApiConstruct(Construct):

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        vpc: ec2.IVpc,
        user_pool: cognito.UserPool,
        db_host: str,
        db_port: str,
        db_name: str,
        db_username: str,
        db_password: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # This SG has no inbound rules of its own — it only needs to exist
        # so DatabaseConstruct.allow_lambda_access() can reference it as the
        # peer allowed to reach RDS on port 3306.
        self.lambda_security_group = ec2.SecurityGroup(
            self,
            "ApplicationsLambdaSecurityGroup",

            vpc = vpc,

            security_group_name = "job-tracker-applications-lambda-sg",

            description = "Security group for the Applications CRUD Lambda",

            allow_all_outbound = True
        )

        # PythonFunction pip-installs backend/requirements.txt into the
        # deployment package at synth time (via Docker, since pydantic's
        # pydantic_core needs Linux-compatible wheels) — plain
        # lambda_.Function wouldn't do this bundling for us.
        self.function = lambda_python.PythonFunction(
            self,
            "ApplicationsFunction",

            entry = "../../backend",

            index = "applications/job_tracker/handler.py",

            handler = "handler",

            runtime = lambda_.Runtime.PYTHON_3_12,

            vpc = vpc,

            # The default VPC here has no private subnets configured, so the
            # Lambda goes in the same public subnets as the database. Lambda
            # ENIs never get a public IP regardless of subnet type, so this
            # function has NO internet access — that's fine, since it only
            # ever talks to RDS over the VPC's internal network. CDK blocks
            # public-subnet Lambda placement by default (it's usually an
            # accidental misconfiguration elsewhere), so this has to be
            # acknowledged explicitly.
            vpc_subnets = ec2.SubnetSelection(
                subnet_type = ec2.SubnetType.PUBLIC
            ),

            allow_public_subnet = True,

            security_groups = [
                self.lambda_security_group
            ],

            environment = {
                "DB_HOST": db_host,
                "DB_PORT": db_port,
                "DB_NAME": db_name,
                "DB_USERNAME": db_username,
                "DB_PASSWORD": db_password
            },

            timeout = Duration.seconds(10),

            memory_size = 256,

            # Without this, PythonFunction rsyncs the ENTIRE "../../backend"
            # entry directory into the deployment package — including the
            # local .venv (~500MB) and the test suite. That blew the asset
            # past Lambda's 250MB unzipped limit; excluding them here is what
            # keeps the package small enough to actually deploy.
            bundling = lambda_python.BundlingOptions(
                asset_excludes = [
                    ".venv",
                    "tests",
                    ".pytest_cache",
                    "__pycache__",
                    "pytest.ini",
                    "requirements-dev.txt"
                ]
            )
        )

        authorizer = apigateway.CognitoUserPoolsAuthorizer(
            self,
            "ApplicationsAuthorizer",
            cognito_user_pools = [user_pool]
        )

        self.api = apigateway.LambdaRestApi(
            self,
            "ApplicationsApi",

            rest_api_name = "job-tracker-applications-api",

            handler = self.function,

            proxy = True,

            default_method_options = apigateway.MethodOptions(
                authorizer = authorizer,
                authorization_type = apigateway.AuthorizationType.COGNITO
            )
        )

        CfnOutput(
            self,
            "ApplicationsApiUrl",
            value = self.api.url
        )
