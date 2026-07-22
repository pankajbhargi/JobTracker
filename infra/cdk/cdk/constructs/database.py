from constructs import Construct
from aws_cdk import (
    RemovalPolicy,
    SecretValue,
    aws_ec2 as ec2,
    aws_rds as rds,
    CfnOutput
)

class DatabaseConstruct(Construct):

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        self.vpc = ec2.Vpc.from_lookup(
            self,
            "DefaultVpc",
            is_default=True
        )

        self.database_security_group = ec2.SecurityGroup(
            self,
            "DatabaseSecurityGroup",

            vpc = self.vpc,

            security_group_name="job-tracker-db-sg",

            description="Security group for Job Tracker RDS database",

            allow_all_outbound=True
        )

        # Exposed (not just local vars) so ApplicationsApiConstruct can wire
        # them into the Lambda's environment variables.
        self.db_username = self.node.try_get_context("dbUsername")
        self.db_password = self.node.try_get_context("dbPassword")
        self.database_name = "jobtracker"

        credentials = rds.Credentials.from_password(
            username = self.db_username,
            password = SecretValue.unsafe_plain_text(self.db_password)
        )

        self.database = rds.DatabaseInstance(
            self,
            "JobTrackerDatabase",

            database_name = "jobtracker",

            engine = rds.DatabaseInstanceEngine.mysql(
                version = rds.MysqlEngineVersion.of(
                    mysql_full_version="8.4.10",
                    mysql_major_version="8.4"
                )
            ),

            instance_type = ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),

            vpc = self.vpc,

            vpc_subnets = ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),

            security_groups = [
                self.database_security_group
            ],

            credentials = credentials,

            allocated_storage = 20,

            max_allocated_storage = 20,

            publicly_accessible = True,

            multi_az = False,

            removal_policy = RemovalPolicy.DESTROY,

            delete_automated_backups = True,

            deletion_protection = False
        )

        CfnOutput(
            self,
            "DatabaseEndpoint",
            value = self.database.db_instance_endpoint_address
        )

        CfnOutput(
            self,
            "DatabasePort",
            value = self.database.db_instance_endpoint_port
        )

    def allow_lambda_access(self, lambda_security_group: ec2.SecurityGroup) -> None:
        """Opens port 3306 to whichever Lambda security group needs to reach
        this database. The security group starts with zero ingress rules —
        nothing can connect until this is called."""
        self.database_security_group.add_ingress_rule(
            peer = lambda_security_group,
            connection = ec2.Port.tcp(3306),
            description = "Allow Lambda access to MySQL"
        )
