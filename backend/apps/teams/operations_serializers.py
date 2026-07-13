from rest_framework import serializers

from apps.accounts.models import User
from apps.teams.models import Team, TeamMember
from apps.teams.services import create_daily_logs_for_member, create_innovation_brief, create_lean_canvas


class OperationsTeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "display_name", "email")


class OperationsCreateTeamSerializer(serializers.Serializer):
    team_name = serializers.CharField(max_length=200)
    project_name = serializers.CharField(max_length=200)
    challenge_category = serializers.CharField(max_length=200)
    teacher_username = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_team_name(self, value):
        if Team.objects.filter(name=value).exists():
            raise serializers.ValidationError("A team with this name already exists.")
        return value

    def validate_teacher_username(self, value):
        if not User.objects.filter(username=value, role=User.Role.TEACHER).exists():
            raise serializers.ValidationError("Teacher not found.")
        return value

    def create(self, validated_data):
        teacher = User.objects.get(username=validated_data["teacher_username"], role=User.Role.TEACHER)
        team = Team.objects.create(
            name=validated_data["team_name"],
            project_name=validated_data["project_name"],
            challenge_category=validated_data["challenge_category"],
            teacher=teacher,
            description=validated_data.get("description", ""),
        )
        create_innovation_brief(team)
        create_lean_canvas(team)
        return team


class OperationsCreateStudentSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=100)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    password = serializers.CharField(max_length=128, default="ChangeMe123!")
    email = serializers.EmailField(required=False, allow_blank=True)
    school = serializers.CharField(required=False, allow_blank=True, default="")
    grade = serializers.CharField(required=False, allow_blank=True, default="")
    team_id = serializers.IntegerField()
    student_role = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_team_id(self, value):
        try:
            team = Team.objects.get(pk=value)
        except Team.DoesNotExist:
            raise serializers.ValidationError("Team not found.") from None
        if team.members.count() >= TeamMember.MAX_MEMBERS:
            raise serializers.ValidationError(f"Team already has {TeamMember.MAX_MEMBERS} members.")
        self.context["team"] = team
        return value

    def validate(self, attrs):
        display_name = attrs["display_name"].strip()
        username = (attrs.get("username") or "").strip()
        if not username:
            username = display_name
            n = 1
            while User.objects.filter(username=username).exists():
                username = f"{display_name}_{n}"
                n += 1
            attrs["username"] = username
        elif User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "Username already exists."})

        email = (attrs.get("email") or "").strip()
        if not email:
            email = f"{attrs['username']}@conrad.local"
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        attrs["email"] = email

        if User.objects.filter(display_name=display_name).exists():
            raise serializers.ValidationError({"display_name": "A user with this name already exists."})

        return attrs

    def create(self, validated_data):
        team = self.context["team"]
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            role=User.Role.STUDENT,
            display_name=validated_data["display_name"],
            school=validated_data.get("school", ""),
            grade=validated_data.get("grade", ""),
        )
        user.set_password(validated_data.get("password", "ChangeMe123!"))
        user.save()
        TeamMember.objects.create(
            team=team,
            student=user,
            student_role=validated_data.get("student_role", ""),
        )
        create_daily_logs_for_member(team, user)
        return user


class OperationsDeleteTeamSerializer(serializers.Serializer):
    team_id = serializers.IntegerField()
    confirm_name = serializers.CharField()

    def validate(self, attrs):
        try:
            team = Team.objects.get(pk=attrs["team_id"])
        except Team.DoesNotExist:
            raise serializers.ValidationError({"team_id": "Team not found."}) from None
        if team.name != attrs["confirm_name"].strip():
            raise serializers.ValidationError({"confirm_name": "Team name does not match. Please type the exact team name."})
        attrs["team"] = team
        return attrs
