from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("teams", "0003_team_co_teachers"),
    ]

    operations = [
        migrations.AddField(
            model_name="team",
            name="product_video_url",
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="team",
            name="product_website_url",
            field=models.URLField(blank=True, max_length=500),
        ),
    ]
