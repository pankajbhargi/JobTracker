from aws_cdk import (
    # Duration,
    Stack,
    # aws_sqs as sqs,
)
from constructs import Construct
from cdk.constructs.authentication import AuthenticationConstruct
from cdk.constructs.database import DatabaseConstruct
from cdk.constructs.applications_api import ApplicationsApiConstruct

class CdkStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # The code that defines your stack goes here

        authentication = AuthenticationConstruct(
            self,
            "Authentication"
        )

        database = DatabaseConstruct(
            self,
            "Database"
        )

        applications_api = ApplicationsApiConstruct(
            self,
            "ApplicationsApi",

            vpc = database.vpc,

            user_pool = authentication.user_pool,

            db_host = database.database.db_instance_endpoint_address,

            db_port = database.database.db_instance_endpoint_port,

            db_name = database.database_name,

            db_username = database.db_username,

            db_password = database.db_password
        )

        database.allow_lambda_access(applications_api.lambda_security_group)

        # example resource
        # queue = sqs.Queue(
        #     self, "CdkQueue",
        #     visibility_timeout=Duration.seconds(300),
        # )
