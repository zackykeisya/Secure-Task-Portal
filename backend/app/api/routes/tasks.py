from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

def _get_task_or_404(db: Session, task_id: int) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan")
    return task

def _ensure_owner_or_admin(task: Task, user: User):
    if user.role != UserRole.ADMIN and task.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

# ---- LIST ----
@router.get("/", response_model=List[TaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Admin melihat semua; employee hanya miliknya sendiri."""
    q = db.query(Task)
    if current.role != UserRole.ADMIN:
        q = q.filter(Task.owner_id == current.id)
    return q.order_by(Task.created_at.desc()).all()

# ---- CREATE ----
@router.post("/", response_model=TaskOut, status_code=201)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    task = Task(**payload.model_dump(), owner_id=current.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

# ---- UPDATE ----
@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    task = _get_task_or_404(db, task_id)
    _ensure_owner_or_admin(task, current)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task

# ---- DELETE ----
@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    task = _get_task_or_404(db, task_id)
    _ensure_owner_or_admin(task, current)
    db.delete(task)
    db.commit()
    return None