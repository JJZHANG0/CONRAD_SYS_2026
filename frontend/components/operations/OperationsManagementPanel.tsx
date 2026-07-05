"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import { TeamPicker } from "@/components/operations/TeamPicker";
import {
  createOpsStudent,
  createOpsTeam,
  deleteOpsTeam,
  fetchOpsTeachers,
  type OpsTeacher,
} from "@/lib/operationsApi";
import { getErrorMessage } from "@/lib/apiClient";
import type { OperationsDashboard } from "@/types/team";

const CATEGORIES = [
  "Health & Nutrition",
  "Energy & Environment",
  "Cyber-Technology & Security",
  "Aerospace & Aviation",
  "Water Sustainability",
];

interface Props {
  teams: OperationsDashboard["teams"];
  onChanged: () => void;
}

export function OperationsManagementPanel({ teams, onChanged }: Props) {
  const [teachers, setTeachers] = useState<OpsTeacher[]>([]);
  const [activeTab, setActiveTab] = useState<"student" | "team" | "delete">("student");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Create student
  const [sName, setSName] = useState("");
  const [sTeamId, setSTeamId] = useState("");
  const [sSchool, setSSchool] = useState("");
  const [sGrade, setSGrade] = useState("");
  const [sRole, setSRole] = useState("");
  const [sPassword, setSPassword] = useState("ChangeMe123!");

  // Create team
  const [tName, setTName] = useState("");
  const [tProject, setTProject] = useState("");
  const [tCategory, setTCategory] = useState(CATEGORIES[0]);
  const [tTeacher, setTTeacher] = useState("");
  const [tDesc, setTDesc] = useState("");

  // Delete team
  const [delTeamId, setDelTeamId] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delStep, setDelStep] = useState<1 | 2>(1);

  useEffect(() => {
    fetchOpsTeachers().then(setTeachers).catch(() => {});
  }, []);

  const selectedDelTeam = teams.find((t) => String(t.id) === delTeamId);

  const resetMsgs = () => {
    setMsg("");
    setErr("");
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMsgs();
    if (!sName.trim() || !sTeamId) {
      setErr("请填写学生姓名并选择队伍");
      return;
    }
    setLoading(true);
    try {
      const res = await createOpsStudent({
        display_name: sName.trim(),
        team_id: Number(sTeamId),
        school: sSchool,
        grade: sGrade,
        student_role: sRole,
        password: sPassword || "ChangeMe123!",
      });
      setMsg(`已创建学生「${res.display_name}」，登录名：${res.username}，已绑定队伍`);
      setSName("");
      setSSchool("");
      setSGrade("");
      setSRole("");
      onChanged();
    } catch (ex) {
      setErr(getErrorMessage(ex));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMsgs();
    if (!tName.trim() || !tProject.trim() || !tTeacher) {
      setErr("请填写队伍名称、项目名称并选择带队老师");
      return;
    }
    setLoading(true);
    try {
      await createOpsTeam({
        team_name: tName.trim(),
        project_name: tProject.trim(),
        challenge_category: tCategory,
        teacher_username: tTeacher,
        description: tDesc,
      });
      setMsg(`已创建队伍「${tName.trim()}」`);
      setTName("");
      setTProject("");
      setTDesc("");
      onChanged();
    } catch (ex) {
      setErr(getErrorMessage(ex));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    resetMsgs();
    if (!selectedDelTeam) {
      setErr("请选择要删除的队伍");
      return;
    }
    if (delStep === 1) {
      setDelStep(2);
      return;
    }
    if (delConfirm.trim() !== selectedDelTeam.name) {
      setErr("队伍名称不匹配，请准确输入完整队伍名");
      return;
    }
    setLoading(true);
    try {
      await deleteOpsTeam(selectedDelTeam.id, delConfirm.trim());
      setMsg(`已删除队伍「${selectedDelTeam.name}」`);
      setDelTeamId("");
      setDelConfirm("");
      setDelStep(1);
      onChanged();
    } catch (ex) {
      setErr(getErrorMessage(ex));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "student" as const, label: "新学生录入" },
    { id: "team" as const, label: "创建队伍" },
    { id: "delete" as const, label: "删除队伍" },
  ];

  return (
    <Card className="mb-8 border-top-yellow !p-5">
      <h2 className="mb-1 text-lg font-semibold text-text-primary">运营管理 · Operations Tools</h2>
      <p className="mb-4 text-xs text-text-secondary">仅运营账号可用 · Log / Brief 为只读浏览</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id);
              resetMsgs();
              setDelStep(1);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-secondary hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
      {err && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

      {activeTab === "student" && (
        <form onSubmit={handleCreateStudent} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">学生姓名 *</label>
            <input className="input-field" value={sName} onChange={(e) => setSName(e.target.value)} placeholder="中文姓名" required />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-text-primary">绑定队伍 *</label>
            <TeamPicker teams={teams} value={sTeamId} onChange={setSTeamId} placeholder="点击选择要绑定的队伍" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">学校</label>
            <input className="input-field" value={sSchool} onChange={(e) => setSSchool(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">年级</label>
            <input className="input-field" value={sGrade} onChange={(e) => setSGrade(e.target.value)} placeholder="G10" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">队内角色</label>
            <input className="input-field" value={sRole} onChange={(e) => setSRole(e.target.value)} placeholder="CEO / CTO..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">初始密码</label>
            <input className="input-field" value={sPassword} onChange={(e) => setSPassword(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "创建中..." : "创建学生并绑定队伍"}</Button>
          </div>
        </form>
      )}

      {activeTab === "team" && (
        <form onSubmit={handleCreateTeam} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">队伍名称 *</label>
            <input className="input-field" value={tName} onChange={(e) => setTName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">项目名称 *</label>
            <input className="input-field" value={tProject} onChange={(e) => setTProject(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">挑战类别 *</label>
            <select className="input-field" value={tCategory} onChange={(e) => setTCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">带队老师 *</label>
            <select className="input-field" value={tTeacher} onChange={(e) => setTTeacher(e.target.value)} required>
              <option value="">选择老师</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.username}>{t.display_name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium">简介</label>
            <input className="input-field" value={tDesc} onChange={(e) => setTDesc(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "创建中..." : "创建队伍"}</Button>
          </div>
        </form>
      )}

      {activeTab === "delete" && (
        <div className="max-w-lg space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">选择队伍 *</label>
            <select
              className="input-field"
              value={delTeamId}
              onChange={(e) => {
                setDelTeamId(e.target.value);
                setDelConfirm("");
                setDelStep(1);
                resetMsgs();
              }}
            >
              <option value="">选择要删除的队伍</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {delStep === 2 && selectedDelTeam && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="mb-2 text-sm font-medium text-red-700">
                确认删除队伍「{selectedDelTeam.name}」？
              </p>
              <p className="mb-3 text-xs text-red-600">
                此操作不可恢复，将删除该队伍所有日志、Brief 及成员关系。
              </p>
              <label className="mb-1 block text-xs font-medium text-red-700">
                请输入完整队伍名称以确认：{selectedDelTeam.name}
              </label>
              <input
                className="input-field border-red-300"
                value={delConfirm}
                onChange={(e) => setDelConfirm(e.target.value)}
                placeholder={selectedDelTeam.name}
              />
            </div>
          )}

          <div className="flex gap-2">
            {delStep === 2 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setDelStep(1);
                  setDelConfirm("");
                  resetMsgs();
                }}
              >
                取消
              </Button>
            )}
            <Button
              variant={delStep === 2 ? "primary" : "secondary"}
              className={delStep === 2 ? "!bg-red-600 hover:!bg-red-700" : ""}
              disabled={loading || !delTeamId}
              onClick={handleDeleteTeam}
            >
              {loading ? "处理中..." : delStep === 1 ? "下一步：确认删除" : "确认删除"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
