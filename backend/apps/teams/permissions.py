from django.contrib.auth import get_user_model

User = get_user_model()


def user_is_operations(user):
    return user.is_authenticated and user.is_operations


def user_is_team_teacher(user, team):
    """Primary teacher, or an explicitly assigned co-teacher."""
    if not user.is_authenticated:
        return False
    if team.teacher_id == user.id:
        return True
    return team.co_teachers.filter(pk=user.id).exists()


def user_can_access_team(user, team):
    if not user.is_authenticated:
        return False
    if user_is_operations(user):
        return True
    if user_is_team_teacher(user, team):
        return True
    if user.is_student and team.members.filter(student=user).exists():
        return True
    return False


def user_can_review_team(user, team):
    """Write teacher comments — assigned teachers / co-teachers only."""
    return user_is_team_teacher(user, team)


def user_is_team_member(user, team):
    return user.is_authenticated and user.is_student and team.members.filter(student=user).exists()
