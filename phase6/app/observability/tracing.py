import contextvars
import uuid
from typing import Optional

_request_id_ctx_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="")

def generate_request_id() -> str:
    return str(uuid.uuid4())

def get_current_request_id() -> str:
    val = _request_id_ctx_var.get()
    return val if val else ""

def set_current_request_id(req_id: Optional[str] = None) -> str:
    assigned = req_id if (req_id and req_id.strip()) else generate_request_id()
    _request_id_ctx_var.set(assigned)
    return assigned
