from django.contrib.auth.tokens import PasswordResetTokenGenerator
import six


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """
    Token generator for email verification links.
    Uses user pk, timestamp, is_verified status, and email to generate
    a unique token that becomes invalid after verification.
    """

    def _make_hash_value(self, user, timestamp):
        return (
            six.text_type(user.pk)
            + six.text_type(timestamp)
            + six.text_type(user.is_verified)
            + six.text_type(user.email)
        )


class PasswordResetToken(PasswordResetTokenGenerator):
    """
    Token generator for password reset links.
    Uses user pk, timestamp, password hash, and last login to generate
    a unique token that becomes invalid after password change.
    """

    def _make_hash_value(self, user, timestamp):
        return (
            six.text_type(user.pk)
            + six.text_type(timestamp)
            + six.text_type(user.password)
            + six.text_type(user.last_login)
        )


email_verification_token = EmailVerificationTokenGenerator()
password_reset_token = PasswordResetToken()
