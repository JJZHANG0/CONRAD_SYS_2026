from apps.briefs.models import BRIEF_FIELDS, InnovationBrief
from apps.logs.models import DailyLog


def is_log_complete(log: DailyLog) -> bool:
    return log.is_complete


def team_log_stats(team):
    logs = DailyLog.objects.filter(team=team)
    member_count = team.members.count()
    total = member_count * 5
    completed = sum(1 for log in logs if is_log_complete(log))
    commented = sum(1 for log in logs if log.has_teacher_comment)
    return {
        "member_count": member_count,
        "log_completion_count": completed,
        "total_log_count": total,
        "teacher_comment_count": commented,
    }


def student_log_stats(student, team):
    logs = DailyLog.objects.filter(team=team, student=student)
    completed = sum(1 for log in logs if is_log_complete(log))
    commented = sum(1 for log in logs if log.has_teacher_comment)
    return {
        "log_completion_count": completed,
        "total_log_count": 5,
        "teacher_comment_count": commented,
    }


def brief_stats(team):
    try:
        brief = team.innovation_brief
    except InnovationBrief.DoesNotExist:
        return {"innovation_brief_completion_count": 0, "innovation_brief_total": len(BRIEF_FIELDS)}
    return {
        "innovation_brief_completion_count": brief.completion_count(),
        "innovation_brief_total": len(BRIEF_FIELDS),
    }


def create_daily_logs_for_member(team, student):
    for day in range(1, 6):
        DailyLog.objects.get_or_create(team=team, student=student, day=day)


def create_innovation_brief(team):
    InnovationBrief.objects.get_or_create(team=team)


def next_incomplete_day(student, team):
    logs = DailyLog.objects.filter(team=team, student=student).order_by("day")
    for log in logs:
        if not is_log_complete(log):
            return log.day
    return None
