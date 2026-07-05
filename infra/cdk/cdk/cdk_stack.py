from aws_cdk import (
    # Duration,
    Stack,
    # aws_sqs as sqs,
)
from constructs import Construct
from cdk.constructs.authentication import AuthenticationConstruct
from cdk.constructs.database import DatabaseConstruct

class CdkStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # The code that defines your stack goes here

        AuthenticationConstruct(
            self,
            "Authentication"
        )

        DatabaseConstruct(
            self,
            "Database"
        )

        # example resource
        # queue = sqs.Queue(
        #     self, "CdkQueue",
        #     visibility_timeout=Duration.seconds(300),
        # )
