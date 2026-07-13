from django.db import models

BMC_FIELDS = [
    "problem",
    "existing_alternatives",
    "solution",
    "key_metrics",
    "unique_value_proposition",
    "high_level_concept",
    "sustainable_advantage",
    "channels",
    "customer_segments",
    "early_adopters",
    "cost_structure",
    "revenue_streams",
]

BMC_WORD_LIMITS = {
    "problem": 40,
    "existing_alternatives": 40,
    "solution": 40,
    "key_metrics": 40,
    "unique_value_proposition": 40,
    "high_level_concept": 10,
    "sustainable_advantage": 40,
    "channels": 40,
    "customer_segments": 40,
    "early_adopters": 40,
    "cost_structure": 40,
    "revenue_streams": 40,
}


class LeanCanvas(models.Model):
    team = models.OneToOneField("teams.Team", on_delete=models.CASCADE, related_name="lean_canvas")
    problem = models.TextField(blank=True, default="")
    existing_alternatives = models.TextField(blank=True, default="")
    solution = models.TextField(blank=True, default="")
    key_metrics = models.TextField(blank=True, default="")
    unique_value_proposition = models.TextField(blank=True, default="")
    high_level_concept = models.TextField(blank=True, default="")
    sustainable_advantage = models.TextField(blank=True, default="")
    channels = models.TextField(blank=True, default="")
    customer_segments = models.TextField(blank=True, default="")
    early_adopters = models.TextField(blank=True, default="")
    cost_structure = models.TextField(blank=True, default="")
    revenue_streams = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def completion_count(self):
        return sum(1 for f in BMC_FIELDS if (getattr(self, f) or "").strip())

    @property
    def completion_rate(self):
        return round(self.completion_count() / len(BMC_FIELDS) * 100, 1)
