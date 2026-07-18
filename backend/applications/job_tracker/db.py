import os
import pymysql
from pymysql.connections import Connection

_connection: Connection | None = None

CREATE_APPLICATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS applications (
    application_id      VARCHAR(36) PRIMARY KEY,
    user_id              VARCHAR(64) NOT NULL,
    company               VARCHAR(255) NOT NULL,
    position              VARCHAR(255) NOT NULL,
    job_description       TEXT NOT NULL,
    status                VARCHAR(20) NOT NULL,
    applied_date          DATE NOT NULL,
    follow_up_date        DATE NULL,
    resume_version_id     VARCHAR(36) NULL,
    notes                 TEXT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
)
"""


def get_connection() -> Connection:
    """Returns a live PyMySQL connection, reusing it across warm Lambda
    invocations — module-level state persists between invocations within
    the same execution environment, so we only pay the connection-setup
    cost on cold starts (or if the connection has dropped)."""
    global _connection

    if _connection is None or not _connection.open:
        _connection = pymysql.connect(
            host=os.environ["DB_HOST"],
            port=int(os.environ["DB_PORT"]),
            user=os.environ["DB_USERNAME"],
            password=os.environ["DB_PASSWORD"],
            database=os.environ["DB_NAME"],
            autocommit=True,
            cursorclass=pymysql.cursors.DictCursor,
        )
        with _connection.cursor() as cursor:
            cursor.execute(CREATE_APPLICATIONS_TABLE)

    return _connection
