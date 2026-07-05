from django.contrib.auth import get_user_model

User = get_user_model()


def user_is_operations(user):
    return user.is_authenticated and user.is_operations


def user_can_access_team(user, team):
    if not user.is_authenticated:
        return False
    if user_is_operations(user):
        return True
    if user.is_teacher and team.teacher_id == user.id:
        return True
    if user.is_student and team.members.filter(student=user).exists():
        return True
    return False


def user_can_review_team(user, team):
    """View student logs and add teacher comments — team teacher or operations."""
    return user_is_team_teacher(user, team) or user_is_operations(user)


def user_is_team_teacher(user, team):
    return user.is_authenticated and user.is_teacher and team.teacher_id == user.id


def user_is_team_member(user, team):
    return user.is_authenticated and user.is_student and team.members.filter(student=user).exists()
