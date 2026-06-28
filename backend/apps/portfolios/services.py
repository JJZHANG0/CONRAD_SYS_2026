"""Portfolio page definitions for initialization and completion calculation."""

PORTFOLIO_PAGES = [
    {"page_id": "cover", "page_number": 0, "part": "PART 01", "title_en": "Cover", "title_zh": "封面"},
    {"page_id": "page01", "page_number": 1, "part": "PART 01", "title_en": "Conrad Challenge Overview", "title_zh": "康莱德挑战赛项目概览"},
    {"page_id": "page02", "page_number": 2, "part": "PART 01", "title_en": "My Innovation Identity", "title_zh": "我的创新者画像"},
    {"page_id": "page03", "page_number": 3, "part": "PART 02", "title_en": "Real-World Problem Discovery", "title_zh": "从生活发现真实问题"},
    {"page_id": "page04", "page_number": 4, "part": "PART 02", "title_en": "Research Evidence", "title_zh": "项目前期研究记录"},
    {"page_id": "page05", "page_number": 5, "part": "PART 03", "title_en": "Online Course Journey", "title_zh": "第一阶段线上课程记录"},
    {"page_id": "page06", "page_number": 6, "part": "PART 03", "title_en": "Academic Knowledge Map", "title_zh": "专业知识应用地图"},
    {"page_id": "page07", "page_number": 7, "part": "PART 03", "title_en": "Skill Development Record", "title_zh": "综合能力成长记录"},
    {"page_id": "page08", "page_number": 8, "part": "PART 04", "title_en": "From Problem to Solution", "title_zh": "从问题到创新方案"},
    {"page_id": "page09", "page_number": 9, "part": "PART 04", "title_en": "Product Concept Design", "title_zh": "产品概念设计"},
    {"page_id": "page10", "page_number": 10, "part": "PART 04", "title_en": "Prototype Development Journey", "title_zh": "产品迭代过程"},
    {"page_id": "page11", "page_number": 11, "part": "PART 05", "title_en": "Business Plan Overview", "title_zh": "商业计划概览"},
    {"page_id": "page12", "page_number": 12, "part": "PART 05", "title_en": "Final Deliverables", "title_zh": "项目成果展示"},
    {"page_id": "page13", "page_number": 13, "part": "PART 05", "title_en": "Technology for Good", "title_zh": "科技与社会责任"},
    {"page_id": "page14", "page_number": 14, "part": "PART 06", "title_en": "My Role & Contribution", "title_zh": "我的团队角色"},
    {"page_id": "page15", "page_number": 15, "part": "PART 06", "title_en": "Team Collaboration", "title_zh": "团队合作与沟通"},
    {"page_id": "page16", "page_number": 16, "part": "PART 06", "title_en": "Failure & Iteration", "title_zh": "失败与成长"},
    {"page_id": "page17", "page_number": 17, "part": "PART 07", "title_en": "Learning Moments", "title_zh": "学习精彩瞬间"},
    {"page_id": "page18", "page_number": 18, "part": "PART 07", "title_en": "Innovation Moments", "title_zh": "创新实践瞬间"},
    {"page_id": "page19", "page_number": 19, "part": "PART 08", "title_en": "Future Academic Pathway", "title_zh": "未来学术规划"},
    {"page_id": "page20", "page_number": 20, "part": "PART 08", "title_en": "College Application Story Bank", "title_zh": "大学申请故事素材库"},
]

# Required text fields per page (image fields validated separately)
PAGE_REQUIRED_FIELDS = {
    "cover": ["studentName", "grade", "school", "targetMajor", "projectName", "challengeCategory"],
    "page01": ["competitionName", "studentRole", "keyAchievement"],
    "page02": ["intendedMajor", "interestOrigin", "problemToSolve", "futureVision"],
    "page03": ["initialObservation", "targetUserGroup", "painPoint1"],
    "page04": ["researchInsights"],
    "page05": ["session1Topic", "session1Knowledge"],
    "page06": ["academicReflection"],
    "page07": ["skillReflection"],
    "page08": ["problemStatement", "finalSolution"],
    "page09": ["productName", "missionStatement"],
    "page10": ["version1Problem", "version1Improvement"],
    "page11": ["valueProposition", "marketOpportunity"],
    "page12": ["finalOutputDescription"],
    "page13": ["technologyValue", "socialImpact"],
    "page14": ["teamRole", "leadershipMoment"],
    "page15": ["collaborationReflection"],
    "page16": ["lessonLearned"],
    "page17": ["moment1Learning"],
    "page18": ["brainstormingDescription"],
    "page19": ["targetMajorFuture", "careerVision"],
    "page20": ["whyMajor", "innovationStory"],
}

IMAGE_FIELDS = {
    "page03": ["researchPhotos"],
    "page04": ["evidenceImages"],
    "page05": ["courseScreenshots"],
    "page09": ["productImages"],
    "page10": ["prototypeImages"],
    "page12": ["qrImages"],
    "page17": ["learningMomentPhotos"],
    "page18": ["innovationMomentPhotos"],
}


def _field_has_value(value) -> bool:
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (list, dict)):
        return len(value) > 0
    if isinstance(value, str):
        return bool(value.strip())
    return True


def compute_page_status(page_data, image_counts: dict | None = None) -> dict:
    """Compute page status, missing fields, and word counts."""
    page_id = page_data.page_id
    fields = page_data.fields or {}
    required = PAGE_REQUIRED_FIELDS.get(page_id, [])
    missing = []

    for field_id in required:
        if not _field_has_value(fields.get(field_id)):
            missing.append(field_id)

    image_counts = image_counts or {}
    for field_id in IMAGE_FIELDS.get(page_id, []):
        count = image_counts.get(field_id, 0)
        if count == 0 and field_id in required:
            missing.append(field_id)

    word_count_summary = {}
    for key, value in fields.items():
        if isinstance(value, str):
            word_count_summary[key] = len(value)

    filled_required = len(required) - len([f for f in missing if f in required])
    total_required = max(len(required), 1)
    fill_ratio = filled_required / total_required

    if not fields and not missing:
        status = "not_started"
    elif missing:
        status = "in_progress" if fill_ratio > 0 else "not_started"
    else:
        status = "completed"

    if page_data.status == "completed" and missing:
        status = "in_progress"

    return {
        "status": status,
        "missing_required_fields": missing,
        "word_count_summary": word_count_summary,
    }


def compute_completion_rate(pages) -> float:
    if not pages:
        return 0.0
    completed = sum(1 for p in pages if p.status == "completed")
    return round((completed / len(pages)) * 100, 1)


def initialize_portfolio_pages(portfolio):
    from .models import PortfolioPageData

    for page_def in PORTFOLIO_PAGES:
        PortfolioPageData.objects.get_or_create(
            portfolio=portfolio,
            page_id=page_def["page_id"],
            defaults={
                "page_number": page_def["page_number"],
                "part": page_def["part"],
                "title_en": page_def["title_en"],
                "title_zh": page_def["title_zh"],
                "fields": {},
                "status": "not_started",
            },
        )


def update_portfolio_completion(portfolio):
    from apps.uploads.models import PortfolioImage

    pages = list(portfolio.pages.all())
    for page in pages:
        image_qs = PortfolioImage.objects.filter(portfolio=portfolio, page_data=page)
        image_counts = {}
        for img in image_qs:
            image_counts[img.field_id] = image_counts.get(img.field_id, 0) + 1

        result = compute_page_status(page, image_counts)
        page.status = result["status"]
        page.missing_required_fields = result["missing_required_fields"]
        page.word_count_summary = result["word_count_summary"]
        page.save(update_fields=["status", "missing_required_fields", "word_count_summary", "updated_at"])

    portfolio.completion_rate = compute_completion_rate(pages)
    if portfolio.completion_rate > 0 and portfolio.status == "draft":
        portfolio.status = "in_progress"
    portfolio.save(update_fields=["completion_rate", "status", "updated_at"])
