"""
Custom application exceptions.

Why this file exists:
- The Service layer should describe errors in business terms
  (e.g. "EmailAlreadyExistsError"), NOT in HTTP terms (e.g. "raise
  HTTPException(status_code=409)"). This keeps the Service layer reusable
  outside of a web context too (e.g. a CLI script, a background worker).
- The Router (API) layer is responsible for translating these business
  errors into the correct HTTP status codes. This is a form of separation
  of concerns: "what went wrong" (Service) vs "how to tell the client"
  (Router).
"""

class AppError(Exception):
    """Base class for all custom application errors."""


class MemberNotFoundError(AppError):
    def __init__(self, member_id: int):
        self.member_id = member_id
        super().__init__(f"Member with id {member_id} not found")


class MobileNumberAlreadyExistsError(AppError):
    def __init__(self, mobile_number: str):
        self.mobile_number = mobile_number
        super().__init__(f"A member with mobile number '{mobile_number}' already exists")


class EmailAlreadyExistsError(AppError):
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"A member with email '{email}' already exists")


class InvalidCredentialsError(AppError):
    def __init__(self):
        super().__init__("Incorrect mobile number or password")


class NotAnAdminError(AppError):
    def __init__(self):
        super().__init__("This action requires admin privileges")


class InsufficientDepositError(AppError):
    def __init__(self, member_id: int, required: str = "500"):
        self.member_id = member_id
        super().__init__(
            f"Member {member_id} has not met the minimum deposit of Rs.{required} yet"
        )


class OtpInvalidOrExpiredError(AppError):
    def __init__(self):
        super().__init__("The OTP code is invalid or has expired")


class CourtNotFoundError(AppError):
    def __init__(self, court_id: int):
        self.court_id = court_id
        super().__init__(f"Court with id {court_id} not found")


class PlayingSessionNotFoundError(AppError):
    def __init__(self, session_id: int):
        self.session_id = session_id
        super().__init__(f"Playing session with id {session_id} not found")


class ExpenseNotFoundError(AppError):
    def __init__(self, expense_id: int):
        self.expense_id = expense_id
        super().__init__(f"Expense with id {expense_id} not found")


class ExpenseShareNotFoundError(AppError):
    def __init__(self, share_id: int):
        self.share_id = share_id
        super().__init__(f"Expense share with id {share_id} not found")


class NoParticipantsError(AppError):
    def __init__(self):
        super().__init__("Cannot split an expense with zero participating members")


class PaymentGatewayError(AppError):
    def __init__(self, message: str):
        super().__init__(f"Payment gateway error: {message}")
