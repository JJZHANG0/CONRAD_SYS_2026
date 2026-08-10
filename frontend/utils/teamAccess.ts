import type { User } from "@/types/user";
import type { TeamDetail } from "@/types/team";

/** Primary teacher or explicitly assigned co-teacher (including ops co-teachers). */
export function isAssignedTeamTeacher(
  user: Pick<User, "id"> | null | undefined,
  team: Pick<TeamDetail, "teacher" | "co_teachers"> | null | undefined
): boolean {
  if (!user || !team?.teacher) return false;
  if (team.teacher.id === user.id) return true;
  return Boolean(team.co_teachers?.some((item) => item.id === user.id));
}
