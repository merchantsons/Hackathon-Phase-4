from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import sys
from app.models import Task
from app.dependencies.auth import get_current_user_id
from app.dependencies.database import get_db_session

router = APIRouter()

# Pydantic models for request/response
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high
    due_date: Optional[str] = None  # ISO format string

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None  # pending, completed
    due_date: Optional[str] = None

@router.get("/api/tasks")
async def list_tasks(
    authenticated_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """List all tasks for the authenticated user"""
    statement = select(Task).where(Task.user_id == authenticated_user_id)
    tasks = session.exec(statement).all()
    return tasks

@router.post("/api/tasks", status_code=201)
async def create_task(
    task_data: TaskCreate,
    authenticated_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Create a new task"""
    # Validate priority
    if task_data.priority not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Priority must be 'low', 'medium', or 'high'")

    # Parse due_date if provided
    due_date_obj = None
    if task_data.due_date:
        try:
            due_date_obj = datetime.fromisoformat(task_data.due_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid due_date format. Use ISO format.")

    # Create task - let SQLModel handle created_at and updated_at via default_factory
    task = Task(
        user_id=authenticated_user_id,
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority or "medium",
        status="pending",
        due_date=due_date_obj
    )

    try:
        session.add(task)
        session.commit()
        session.refresh(task)
        print(f"✅ Task created successfully: {task.id} - {task.title}", file=sys.stderr, flush=True)
        return task
    except Exception as e:
        session.rollback()
        print(f"❌ Failed to create task: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        # Get more detailed error information
        error_detail = str(e)
        if hasattr(e, 'orig'):
            error_detail = f"{error_detail} (Original: {e.orig})"
        raise HTTPException(status_code=500, detail=f"Failed to create task: {error_detail}")

@router.get("/api/tasks/{task_id}")
async def get_task(
    task_id: int,
    authenticated_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Get a single task by ID"""
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == authenticated_user_id
    )
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task

@router.put("/api/tasks/{task_id}")
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    authenticated_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Update an existing task"""
    try:
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == authenticated_user_id
        )
        task = session.exec(statement).first()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Update fields if provided
        if task_data.title is not None:
            task.title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description
        if task_data.priority is not None:
            if task_data.priority not in ["low", "medium", "high"]:
                raise HTTPException(status_code=400, detail="Priority must be 'low', 'medium', or 'high'")
            task.priority = task_data.priority
        if task_data.status is not None:
            if task_data.status not in ["pending", "completed"]:
                raise HTTPException(status_code=400, detail="Status must be 'pending' or 'completed'")
            task.status = task_data.status
        if task_data.due_date is not None:
            if task_data.due_date == "":
                task.due_date = None
            else:
                try:
                    task.due_date = datetime.fromisoformat(task_data.due_date.replace('Z', '+00:00'))
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid due_date format. Use ISO format.")

        task.updated_at = datetime.utcnow()

        session.add(task)
        session.commit()
        session.refresh(task)
        print(f"✅ Task updated successfully: {task.id} - {task.title}", file=sys.stderr, flush=True)
        return task
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"❌ Failed to update task: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@router.delete("/api/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    authenticated_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Delete a task"""
    try:
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == authenticated_user_id
        )
        task = session.exec(statement).first()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        task_title = task.title
        session.delete(task)
        session.commit()
        print(f"✅ Task deleted successfully: {task_id} - {task_title}", file=sys.stderr, flush=True)
        return None
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"❌ Failed to delete task: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

@router.patch("/api/tasks/{task_id}/complete")
async def complete_task(
    task_id: int,
    authenticated_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Mark a task as completed"""
    try:
        statement = select(Task).where(
            Task.id == task_id,
            Task.user_id == authenticated_user_id
        )
        task = session.exec(statement).first()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        task.status = "completed"
        task.updated_at = datetime.utcnow()

        session.add(task)
        session.commit()
        session.refresh(task)
        print(f"✅ Task completed successfully: {task.id} - {task.title}", file=sys.stderr, flush=True)
        return task
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"❌ Error completing task {task_id}: {str(e)}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=f"Failed to complete task: {str(e)}")
