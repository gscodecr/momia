import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )

def upload_to_s3(file_path: str, object_name: str) -> str:
    """
    Sube un archivo local a S3 y retorna su URL pública.
    """
    bucket = os.getenv('AWS_BUCKET_NAME')
    if not bucket:
        return None

    s3_client = get_s3_client()
    try:
        s3_client.upload_file(
            file_path, 
            bucket, 
            object_name,
            ExtraArgs={'ContentType': 'image/webp'} 
        )
        # Generar la URL pública basada en el formato estándar de AWS S3
        region = os.getenv('AWS_REGION', 'us-east-1')
        url = f"https://{bucket}.s3.{region}.amazonaws.com/{object_name}"
        return url
    except (NoCredentialsError, ClientError) as e:
        print(f"Error subiendo a S3: {e}")
        return None
