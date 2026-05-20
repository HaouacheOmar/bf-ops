from rest_framework.views import exception_handler
from django.db import IntegrityError
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, IntegrityError):
        msg = str(exc)
        if "UNIQUE constraint failed" in msg:
            detail = "A duplicate entry error occurred. This already exists."
        else:
            detail = "A database integrity error occurred. " + msg
        return Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)

    if response is None:
        return Response({'detail': "An unexpected system error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
