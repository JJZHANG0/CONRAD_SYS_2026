from django.db import models


BRIEF_FIELDS = [
    "elevator_pitch",
    "team_overview",
    "opportunity",
    "key_metrics",
    "validation_progress",
    "market",
    "competition",
    "go_to_market",
    "business_model",
    "fundraising",
]

BRIEF_WORD_LIMITS = {
    "elevator_pitch": 150,
    "team_overview": 150,
    "opportunity": 300,
    "key_metrics": 750,
    "validation_progress": 450,
    "market": 300,
    "competition": 300,
    "go_to_market": 150,
    "business_model": 300,
    "fundraising": 150,
}

BRIEF_TOTAL_WORD_LIMIT = sum(BRIEF_WORD_LIMITS.values())  # 3000


class InnovationBrief(models.Model):
    team = models.OneToOneField("teams.Team", on_delete=models.CASCADE, related_name="innovation_brief")
    elevator_pitch = models.TextField(blank=True)
    team_overview = models.TextField(blank=True)
    opportunity = models.TextField(blank=True)
    key_metrics = models.TextField(blank=True)
    validation_progress = models.TextField(blank=True)
    market = models.TextField(blank=True)
    competition = models.TextField(blank=True)
    go_to_market = models.TextField(blank=True)
    business_model = models.TextField(blank=True)
    fundraising = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def completion_count(self):
        return sum(1 for f in BRIEF_FIELDS if (getattr(self, f) or "").strip())

    @property
    def completion_rate(self):
        return round(self.completion_count() / len(BRIEF_FIELDS) * 100, 1)
