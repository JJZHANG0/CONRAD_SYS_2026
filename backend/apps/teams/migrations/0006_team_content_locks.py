from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("teams", "0005_correct_qinglan_category"),
    ]

    operations = [
        migrations.AddField(
            model_name="team",
            name="bmc_locked",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="team",
            name="innovation_brief_locked",
            field=models.BooleanField(default=False),
        ),
    ]
