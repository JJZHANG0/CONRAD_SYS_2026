from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date, datetime
import re
from teams.models import Stage, Team, Student
from deliverables.models import Deliverable
from lessons.models import LessonRecord, CalendarEvent
from evaluations.models import TeacherEvaluation, TeamScore
from risks.models import RiskLog, ActivityLog
from templates_lib.models import TemplateResource

User = get_user_model()

TRACK_MAP = {
    '营养健康': 'health',
    '网络安全': 'cyber',
    '水可持续': 'water',
    '航空航天': 'aerospace',
    '能源环境': 'energy',
}

STAFF_USERNAME = {
    '程雪晴': 'ops_chengxueqing',
    '张雪航': 'ops_zhangxuehang',
    '张捷嘉': 'coach_zhangjia',
    '董之恒': 'coach_dongzhiheng',
    '吴奎': 'coach_wukui',
    '邓金平': 'coach_dengjinping',
    '夏宏伟': 'coach_xiahongwei',
    '王钰': 'coach_wangyu',
    '李进坚': 'coach_lijianjian',
    '花宇轩': 'coach_huayuxuan',
    '郑永雄': 'coach_zhengyongxiong',
    '徐新泽': 'coach_xuxinze',
    '钱其萩': 'coach_qianqishu',
    '杜步天': 'coach_dubutian',
    '王银申': 'coach_wangyinshen',
}

OPS_NAMES = {'程雪晴', '张雪航'}

# 完整表格数据
TEAM_ROWS = [
    {
        'team_name': 'TEAM 「心识」', 'track': '营养健康', 'website_status': '内部完成',
        'rnd_approved': False, 'crm_number': '',
        'offline_start': '2026-08-03', 'offline_end': '2026-08-07',
        'offline_city': '杭州HUB', 'classroom': '杭州-大教室A',
        'coach': '张捷嘉', 'ops': '程雪晴', 'offline_lead': '程雪晴',
        'project_proposal': '2026康莱德项目立项申请书（心识App）',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳26CC-TEAM 心识 队伍群',
        'task_tracking_doc': '任务跟踪表- 心识', 'project_log_doc': '2026 TEAM-心识-项目日志',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 50, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「泛视」', 'track': '网络安全', 'website_status': '内部完成',
        'rnd_approved': True, 'crm_number': 'ARF2026043000001266',
        'offline_start': '2026-08-03', 'offline_end': '2026-08-07',
        'offline_city': '杭州HUB', 'classroom': '杭州-大教室B',
        'coach': '董之恒', 'ops': '程雪晴', 'offline_lead': '程雪晴',
        'project_proposal': '2026康莱德项目立项申请书_helis.docx',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 HELIOS 队伍群',
        'task_tracking_doc': '任务跟踪表- 泛视', 'project_log_doc': '2026 TEAM-HELIOS-项目日志',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 20, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「水界」', 'track': '水可持续', 'website_status': '',
        'rnd_approved': True, 'crm_number': 'ARF2026040300001250',
        'offline_start': '2026-08-03', 'offline_end': '2026-08-07',
        'offline_city': '杭州HUB', 'classroom': '杭州-生物会议室',
        'coach': '吴奎', 'ops': '程雪晴', 'offline_lead': '程雪晴',
        'project_proposal': '2026康莱德项目立项申请书_水界-海水淡化装置',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 水界 Vaporis',
        'task_tracking_doc': '任务跟踪表- 水界', 'project_log_doc': 'TEAM- DVD海水淡化 项目日志',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「神控」', 'track': '营养健康', 'website_status': '内部完成',
        'rnd_approved': True, 'crm_number': 'ARF2026043000001266',
        'offline_start': '2026-08-10', 'offline_end': '2026-08-14',
        'offline_city': '杭州HUB', 'classroom': '杭州-大教室A',
        'coach': '董之恒', 'ops': '程雪晴', 'offline_lead': '程雪晴',
        'project_proposal': '2026康莱德项目立项申请书_Neurox.docx',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 神控 NeuroX',
        'task_tracking_doc': '任务跟踪表- 神控', 'project_log_doc': '2026 TEAM-神控-项目日志',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 11, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「轻腕」', 'track': '营养健康', 'website_status': '内部完成',
        'rnd_approved': True, 'crm_number': 'ARF2026042100001260',
        'offline_start': '2026-07-27', 'offline_end': '2026-07-31',
        'offline_city': '上海HUB', 'classroom': '上海-启迪小教室',
        'coach': '邓金平', 'ops': '张雪航', 'offline_lead': '张雪航',
        'project_proposal': '2026康莱德项目立项申请书-轻腕 腱鞘炎',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 轻腕',
        'task_tracking_doc': '任务跟踪表- 轻腕', 'project_log_doc': '2026 TEAM-轻腕-项目日志',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「埙」', 'track': '营养健康', 'website_status': '',
        'rnd_approved': False, 'crm_number': 'ARF2026050600001269',
        'offline_start': '2026-10-02', 'offline_end': '2026-10-06',
        'offline_city': '上海HUB', 'classroom': '杭州-大教室C',
        'coach': '夏宏伟', 'ops': '张雪航', 'offline_lead': '张雪航',
        'project_proposal': '', 'budget_doc': '', 'okr_link': '',
        'team_chat_group': '', 'task_tracking_doc': '', 'project_log_doc': '',
        'ceo_status': 'Waiting List', 'cpo_status': 'Waiting List',
        'cto_status': 'Waiting List', 'cmo_status': 'Waiting List', 'cfo_status': 'Waiting List',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「听障眼镜」', 'track': '网络安全', 'website_status': '内部完成',
        'rnd_approved': True, 'crm_number': 'ARF2026043000001266',
        'offline_start': '2026-07-20', 'offline_end': '2026-07-24',
        'offline_city': '杭州HUB', 'classroom': '杭州-大教室A',
        'coach': '董之恒', 'ops': '张雪航', 'offline_lead': '张雪航',
        'project_proposal': '2026康莱德项目立项申请书_听障眼镜',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 听障眼镜 Auden',
        'task_tracking_doc': '任务跟踪表- 听障眼镜', 'project_log_doc': '2026 TEAM-听障-项目日志',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 11, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「冰箱」', 'track': '营养健康', 'website_status': '外部完成',
        'rnd_approved': True, 'crm_number': '单独走报销',
        'offline_start': '2026-07-13', 'offline_end': '2026-07-17',
        'offline_city': '上海HUB', 'classroom': '上海-加速器教室',
        'coach': '王钰', 'ops': '张雪航', 'offline_lead': '张雪航',
        'project_proposal': '2026康莱德项目立项申请书(冰箱）',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 冰箱贴',
        'task_tracking_doc': '', 'project_log_doc': '',
        'ceo_status': 'Not Available', 'cpo_status': 'Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「舱外太空工具」', 'track': '航空航天', 'website_status': '外部完成',
        'rnd_approved': False, 'crm_number': 'ARF2026043000001268',
        'offline_start': '2026-10-02', 'offline_end': '2026-10-06',
        'offline_city': '上海HUB', 'classroom': '杭州-大教室B',
        'coach': '李进坚', 'ops': '张雪航', 'offline_lead': '张雪航',
        'project_proposal': '2026康莱德项目立项申请书(EVAFORGE）',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 舱外太空工具',
        'task_tracking_doc': '任务跟踪表- 舱外太空工具', 'project_log_doc': '',
        'ceo_status': 'Available', 'cpo_status': 'Not Available',
        'cto_status': 'Available', 'cmo_status': 'Available', 'cfo_status': 'Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「启行 外骨骼」', 'track': '营养健康', 'website_status': '内部完成',
        'rnd_approved': True, 'crm_number': 'ARF2026042700001264',
        'offline_start': '2026-07-13', 'offline_end': '2026-07-17',
        'offline_city': '广州HUB', 'classroom': '杭州-大教室B',
        'coach': '花宇轩', 'ops': '程雪晴', 'offline_lead': '程雪晴',
        'project_proposal': '膝盖康复外骨骼立项书',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 外骨骼',
        'task_tracking_doc': '任务跟踪表- 外骨骼', 'project_log_doc': '',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「加密目镜」', 'track': '网络安全', 'website_status': '',
        'rnd_approved': True, 'crm_number': 'ARF2026050600001269',
        'offline_start': '2026-08-03', 'offline_end': '2026-08-07',
        'offline_city': '杭州HUB', 'classroom': '杭州-大教室C',
        'coach': '夏宏伟', 'ops': '张雪航', 'offline_lead': '张雪航',
        'project_proposal': '2026康莱德项目立项申请书-SITAS加密目镜.docx',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 加密目镜',
        'task_tracking_doc': '任务跟踪表- 加密目镜', 'project_log_doc': '',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「净风塔」', 'track': '能源环境', 'website_status': '内部完成',
        'rnd_approved': True, 'crm_number': 'ARF2026043000001267',
        'offline_start': '2026-08-10', 'offline_end': '2026-08-14',
        'offline_city': '杭州HUB', 'classroom': '杭州-生物会议室',
        'coach': '邓金平', 'ops': '程雪晴', 'offline_lead': '程雪晴',
        'project_proposal': '2026康莱德项目立项申请书(净风塔）',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 净风塔',
        'task_tracking_doc': '任务跟踪表- 净风塔', 'project_log_doc': '',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「天巡者」', 'track': '航空航天', 'website_status': '',
        'rnd_approved': True, 'crm_number': 'ARF2026050600001269',
        'offline_start': '2026-08-10', 'offline_end': '2026-08-14',
        'offline_city': '杭州HUB', 'classroom': '杭州-大教室B',
        'coach': '夏宏伟', 'ops': '张雪航', 'offline_lead': '张雪航',
        'project_proposal': '天巡者_SkyPatrol_2026康莱德项目立项申请书.docx',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '🇨🇳「26COND」 Team 天巡者',
        'task_tracking_doc': '任务跟踪表- 天巡者', 'project_log_doc': '',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「腰椎」', 'track': '营养健康', 'website_status': '内部完成',
        'rnd_approved': True, 'crm_number': 'ARF2026051800001274',
        'offline_start': '2026-10-02', 'offline_end': '2026-10-06',
        'offline_city': '杭州HUB', 'classroom': '杭州-大教室A',
        'coach': '邓金平', 'ops': '程雪晴', 'offline_lead': '程雪晴',
        'project_proposal': '2026康莱德项目立项申请书(腰椎）',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '', 'task_tracking_doc': '任务跟踪表- 腰椎', 'project_log_doc': '',
        'ceo_status': 'Available', 'cpo_status': 'Available',
        'cto_status': 'Available', 'cmo_status': 'Available', 'cfo_status': 'Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「智跑」', 'track': '网络安全', 'website_status': '外部完成',
        'rnd_approved': True, 'crm_number': 'ARF2026052900001278',
        'offline_start': '2026-08-10', 'offline_end': '2026-08-14',
        'offline_city': '杭州HUB', 'classroom': '',
        'coach': '郑永雄', 'ops': '张雪航', 'offline_lead': '张雪航',
        'project_proposal': '2026康莱德项目立项申请书-智跑 机器人',
        'budget_doc': '2026 康莱德 耗材预算表', 'okr_link': '2026 康莱德队伍 OKR 看板',
        'team_chat_group': '', 'task_tracking_doc': '任务跟踪表- 智跑',
        'project_log_doc': '2026 TEAM-智跑-项目日志',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「花洒伴侣」', 'track': '水可持续', 'website_status': '外部完成',
        'rnd_approved': False, 'crm_number': '',
        'offline_start': '2026-10-02', 'offline_end': '2026-10-06',
        'offline_city': '杭州HUB', 'classroom': '',
        'coach': '徐新泽', 'ops': '程雪晴', 'offline_lead': '',
        'project_proposal': '2026康莱德项目立项申请书',
        'budget_doc': '', 'okr_link': '',
        'team_chat_group': '', 'task_tracking_doc': '任务跟踪表- 花洒', 'project_log_doc': '',
        'ceo_status': 'Not Available', 'cpo_status': 'Available',
        'cto_status': 'Available', 'cmo_status': 'Available', 'cfo_status': 'Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「田瞳」', 'track': '能源环境', 'website_status': '外部完成',
        'rnd_approved': False, 'crm_number': '',
        'offline_start': '2026-10-02', 'offline_end': '2026-10-06',
        'offline_city': '杭州HUB', 'classroom': '',
        'coach': '郑永雄', 'ops': '程雪晴', 'offline_lead': '',
        'project_proposal': '2026 康莱德项目立项申请书-田瞳',
        'budget_doc': '', 'okr_link': '',
        'team_chat_group': '', 'task_tracking_doc': '任务跟踪表- 田瞳', 'project_log_doc': '',
        'ceo_status': 'Not Available', 'cpo_status': 'Waiting List',
        'cto_status': 'Not Available', 'cmo_status': 'Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「维拉」', 'track': '航空航天', 'website_status': '内部完成',
        'rnd_approved': False, 'crm_number': '',
        'offline_start': '2026-08-12', 'offline_end': '2026-08-16',
        'offline_city': '杭州HUB', 'classroom': '',
        'coach': '钱其萩', 'ops': '张雪航', 'offline_lead': '张捷嘉',
        'project_proposal': '', 'budget_doc': '', 'okr_link': '',
        'team_chat_group': '', 'task_tracking_doc': '', 'project_log_doc': '',
        'ceo_status': 'Available', 'cpo_status': 'Available',
        'cto_status': 'Not Available', 'cmo_status': 'Available', 'cfo_status': 'Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「清澜」', 'track': '能源环境', 'website_status': '外部完成',
        'rnd_approved': False, 'crm_number': '',
        'offline_start': '2026-10-02', 'offline_end': '2026-10-06',
        'offline_city': '杭州HUB', 'classroom': '',
        'coach': '杜步天', 'ops': '程雪晴', 'offline_lead': '',
        'project_proposal': '副本-2026康莱德项目立项申请书(模板）',
        'budget_doc': '', 'okr_link': '',
        'team_chat_group': '', 'task_tracking_doc': '', 'project_log_doc': '',
        'ceo_status': 'Waiting List', 'cpo_status': 'Waiting List',
        'cto_status': 'Waiting List', 'cmo_status': 'Waiting List', 'cfo_status': 'Waiting List',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「攀风者」', 'track': '能源环境', 'website_status': '外部完成',
        'rnd_approved': False, 'crm_number': '',
        'offline_start': '2026-10-02', 'offline_end': '2026-10-06',
        'offline_city': '上海HUB', 'classroom': '',
        'coach': '王银申', 'ops': '张雪航', 'offline_lead': '',
        'project_proposal': '', 'budget_doc': '', 'okr_link': '',
        'team_chat_group': '', 'task_tracking_doc': '', 'project_log_doc': '',
        'ceo_status': 'Not Available', 'cpo_status': 'Not Available',
        'cto_status': 'Not Available', 'cmo_status': 'Not Available', 'cfo_status': 'Not Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
    {
        'team_name': 'TEAM 「蜂泉」', 'track': '水可持续', 'website_status': '外部完成',
        'rnd_approved': False, 'crm_number': '',
        'offline_start': '', 'offline_end': '',
        'offline_city': '', 'classroom': '',
        'coach': '', 'ops': '', 'offline_lead': '',
        'project_proposal': '', 'budget_doc': '', 'okr_link': '',
        'team_chat_group': '', 'task_tracking_doc': '', 'project_log_doc': '',
        'ceo_status': 'Available', 'cpo_status': 'Available',
        'cto_status': 'Available', 'cmo_status': 'Available', 'cfo_status': 'Available',
        'stage1': 0, 'stage2': 0, 'stage3': 0,
    },
]

DELIVERABLE_TEMPLATES = {
    0: ['项目预习资料', '教学讲义课包', 'NEEDS TO KNOW', 'BMC商业画布', '阶段总结与任务拆解'],
    1: ['PBL路演演讲评价表', '完整商业计划书', '产品视频脚本&素材包', '网站完整Figma设计链接',
        '路演PPT以及演讲稿', '团队合照照片', '阶段复盘与修改清单'],
    2: ['决赛创新简述报告', 'PBL完整产品视频', '决赛6页Briefing Deck', '决赛完整网站链接',
        '决赛模拟路演录制', '队伍50个模拟答辩Q&A', '决赛三折页PDF文件', '决赛易拉宝PDF文件'],
}

TEMPLATE_DATA = [
    ('项目预习资料模板', 0, '预习资料'),
    ('NEEDS TO KNOW 模板', 0, '预习资料'),
    ('BMC商业画布模板', 0, '商业分析'),
    ('商业计划书模板', 1, '商业文档'),
    ('路演PPT模板', 1, '路演材料'),
    ('Briefing Deck模板', 2, '决赛材料'),
    ('模拟答辩Q&A模板', 2, '答辩准备'),
]

ROLE_LABELS = ['CEO', 'CPO', 'CTO', 'CMO', 'CFO']
ROLE_KEYS = ['ceo_status', 'cpo_status', 'cto_status', 'cmo_status', 'cfo_status']


def extract_project_name(team_name):
    m = re.search(r'「(.+?)」', team_name)
    return m.group(1) if m else team_name


class Command(BaseCommand):
    help = '导入康莱德真实队伍表格数据'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='清除现有队伍数据后重新导入')

    def handle(self, *args, **options):
        if Team.objects.exists() and not options['force']:
            self.stdout.write('数据已存在，请使用 --force 重新导入')
            return

        if options['force']:
            self._clear_team_data()

        self._ensure_admin_and_stages()
        staff = self._ensure_staff()
        self._import_teams(staff)
        self.stdout.write(self.style.SUCCESS(f'成功导入 {len(TEAM_ROWS)} 支队伍！'))

    def _clear_team_data(self):
        self.stdout.write('清除现有队伍数据...')
        Deliverable.objects.all().delete()
        LessonRecord.objects.all().delete()
        CalendarEvent.objects.all().delete()
        TeacherEvaluation.objects.all().delete()
        TeamScore.objects.all().delete()
        RiskLog.objects.all().delete()
        ActivityLog.objects.all().delete()
        Student.objects.all().delete()
        Team.objects.all().delete()

    def _ensure_admin_and_stages(self):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_user('admin', password='admin123', name='系统管理员', role='super_admin')

        if not Stage.objects.exists():
            Stage.objects.create(name='第一阶段：项目立项与基础搭建', order=1, start_date=date(2026, 9, 1), end_date=date(2026, 12, 31))
            Stage.objects.create(name='第二阶段：PBL深化与正式作品产出', order=2, start_date=date(2027, 1, 1), end_date=date(2027, 4, 30))
            Stage.objects.create(name='第三阶段：决赛冲刺与完整展示系统', order=3, start_date=date(2027, 5, 1), end_date=date(2027, 7, 31))
            Stage.objects.create(name='最终提交', order=4, start_date=date(2027, 8, 1), end_date=date(2027, 8, 15))
            Stage.objects.create(name='模拟答辩', order=5, start_date=date(2027, 8, 16), end_date=date(2027, 9, 15))
            Stage.objects.create(name='赛后复盘', order=6, start_date=date(2027, 9, 16), end_date=date(2027, 10, 31))

        admin = User.objects.get(username='admin')
        stages = list(Stage.objects.all())
        if not TemplateResource.objects.exists():
            for title, stage_idx, cat in TEMPLATE_DATA:
                TemplateResource.objects.create(
                    title=title, stage=stages[stage_idx], category=cat,
                    description=f'{title}标准模板', uploaded_by=admin,
                )

    def _ensure_staff(self):
        staff = {}
        all_names = set(STAFF_USERNAME.keys())
        for name in all_names:
            role = 'project_manager' if name in OPS_NAMES else 'mentor'
            username = STAFF_USERNAME[name]
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'name': name, 'role': role, 'email': f'{username}@conrad.edu'},
            )
            if created:
                user.set_password('staff123')
                user.save()
            else:
                user.name = name
                user.role = role
                user.save(update_fields=['name', 'role'])
            staff[name] = user
        return staff

    def _parse_date(self, s):
        if not s:
            return None
        try:
            return date.fromisoformat(s)
        except ValueError:
            return None

    def _infer_stage(self, stages, s1, s2, s3):
        if s3 > 0:
            return stages[2]
        if s2 > 0:
            return stages[1]
        return stages[0]

    def _import_teams(self, staff):
        stages = list(Stage.objects.order_by('order'))
        now = timezone.now()
        statuses_pool = ['approved', 'submitted', 'in_progress', 'not_started']

        for row in TEAM_ROWS:
            proj = extract_project_name(row['team_name'])
            s1, s2, s3 = row['stage1'], row['stage2'], row['stage3']
            coach = staff.get(row['coach'])
            ops = staff.get(row['ops'])
            offline = staff.get(row['offline_lead']) if row['offline_lead'] else None
            current_stage = self._infer_stage(stages, s1, s2, s3)
            completion = round((s1 + s2 + s3) / 3, 1)

            risk = 'normal'
            if s1 < 10 and row.get('offline_end') and self._parse_date(row['offline_end']):
                if self._parse_date(row['offline_end']) < date(2026, 9, 1):
                    risk = 'attention'

            team = Team.objects.create(
                team_name=row['team_name'],
                project_name_cn=proj,
                project_name_en=proj,
                track=TRACK_MAP.get(row['track'], 'health'),
                risk_status=risk,
                project_manager=ops,
                lead_mentor=coach,
                offline_lead=offline,
                current_stage=current_stage,
                deliverable_completion_rate=completion,
                mentor_score=min(70 + s1 // 5, 95),
                website_status=row['website_status'],
                rnd_approved=row['rnd_approved'],
                crm_number=row['crm_number'],
                offline_start=self._parse_date(row['offline_start']),
                offline_end=self._parse_date(row['offline_end']),
                offline_city=row['offline_city'],
                classroom=row['classroom'],
                project_proposal=row['project_proposal'],
                budget_doc=row['budget_doc'],
                okr_link=row['okr_link'],
                team_chat_group=row['team_chat_group'],
                task_tracking_doc=row['task_tracking_doc'],
                project_log_doc=row['project_log_doc'],
                stage1_progress=s1,
                stage2_progress=s2,
                stage3_progress=s3,
                ceo_status=row['ceo_status'],
                cpo_status=row['cpo_status'],
                cto_status=row['cto_status'],
                cmo_status=row['cmo_status'],
                cfo_status=row['cfo_status'],
            )

            for label, key in zip(ROLE_LABELS, ROLE_KEYS):
                status = row[key]
                if status:
                    Student.objects.create(
                        team=team,
                        name=f'{proj}-{label}',
                        role_in_team=label,
                        notes=status,
                        grade='高二',
                        school='国际学校',
                    )

            for stage_idx, titles in DELIVERABLE_TEMPLATES.items():
                for i, title in enumerate(titles):
                    if current_stage.order < stage_idx + 1:
                        status = 'not_started'
                    elif current_stage.order == stage_idx + 1:
                        progress = [s1, s2, s3][stage_idx]
                        if progress >= 50:
                            status = statuses_pool[i % 2]
                        elif progress > 0:
                            status = 'in_progress'
                        else:
                            status = 'not_started'
                    else:
                        status = 'approved'
                    Deliverable.objects.create(
                        team=team,
                        stage=stages[stage_idx],
                        title=title,
                        status=status,
                        owner=coach,
                        due_date=date(2027, stage_idx + 1, min(15 + i * 5, 28)),
                        score=8.5 if status == 'approved' else None,
                    )

            if coach and row['offline_start']:
                start = self._parse_date(row['offline_start'])
                if start:
                    CalendarEvent.objects.create(
                        team=team,
                        mentor=coach,
                        start_time=timezone.make_aware(
                            datetime.combine(start, datetime.min.time().replace(hour=9))
                        ),
                        end_time=timezone.make_aware(
                            datetime.combine(start, datetime.min.time().replace(hour=17))
                        ),
                        topic=f'{proj} 线下集训',
                        stage=current_stage,
                    )

            if coach and ops:
                TeacherEvaluation.objects.create(
                    mentor=coach,
                    team=team,
                    score_a=s1 * 0.6,
                    score_b=12,
                    score_c=8,
                    score_d=4,
                    score_e=7,
                    evaluated_by=ops,
                    comments=f'{proj}项目持续推进中',
                )

        ActivityLog.objects.create(
            action='import',
            description=f'系统导入 {len(TEAM_ROWS)} 支康莱德队伍完整表格数据',
            user=User.objects.get(username='admin'),
        )
