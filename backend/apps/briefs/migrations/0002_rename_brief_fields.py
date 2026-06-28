from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("briefs", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="our_solution",
            new_name="elevator_pitch",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="team_roles_next_steps",
            new_name="team_overview",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="problem_statement",
            new_name="opportunity",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="technical_design",
            new_name="key_metrics",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="prototype_testing",
            new_name="validation_progress",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="target_users",
            new_name="market",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="existing_solutions",
            new_name="competition",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="innovation_points",
            new_name="go_to_market",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="market_business",
            new_name="business_model",
        ),
        migrations.RenameField(
            model_name="innovationbrief",
            old_name="social_impact",
            new_name="fundraising",
        ),
    ]
