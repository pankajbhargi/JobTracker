from constructs import Construct
from aws_cdk import (
    CfnOutput,
    RemovalPolicy,
    aws_cognito as cognito
)


class AuthenticationConstruct(Construct):

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        self.user_pool = cognito.UserPool(
            self,
            "JobTrackerUserPool",

            user_pool_name = "job-tracker-user-pool",

            self_sign_up_enabled = True,

            sign_in_aliases = cognito.SignInAliases(
                email = True
            ),

            auto_verify = cognito.AutoVerifiedAttrs(
                email = True
            ),

            password_policy = cognito.PasswordPolicy(
                min_length = 8,
                require_lowercase = True,
                require_uppercase = True,
                require_digits = True,
                require_symbols = False
            ),

            account_recovery = cognito.AccountRecovery.EMAIL_ONLY,

            removal_policy = RemovalPolicy.DESTROY
        )

        self.user_pool_client = self.user_pool.add_client(
            "JobTrackerAppClient",

            user_pool_client_name = "job-tracker-client",

            auth_flows=cognito.AuthFlow(
                user_password = True,
                user_srp = True
            ),

            generate_secret = False,

            prevent_user_existence_errors = True
        )

        self.user_pool_domain = self.user_pool.add_domain(
            "JobTrackerDomain",

            cognito_domain=cognito.CognitoDomainOptions(
                domain_prefix = "jobtracker-pankaj-2026"
            )
        )

        CfnOutput(
            self,
            "UserPoolId",
            value = self.user_pool.user_pool_id
        )

        CfnOutput(
            self,
            "UserPoolClientId",
            value = self.user_pool_client.user_pool_client_id
        )

        CfnOutput(
            self,
            "UserPoolArn",
            value = self.user_pool.user_pool_arn
        )