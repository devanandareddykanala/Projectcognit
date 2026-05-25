import { MemberRole } from "@/backend";
import type { FarmMember } from "@/backend.d.ts";
import { AddMemberWizard } from "@/components/AddMemberWizard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useFarm } from "@/context/FarmContext";
import { useActor } from "@/hooks/useActor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function roleLabel(role: MemberRole): {
  text: string;
  variant: "default" | "secondary" | "outline";
} {
  switch (role) {
    case MemberRole.Admin:
      return { text: "Malik", variant: "default" };
    case MemberRole.Member:
      return { text: "Sadasya", variant: "secondary" };
    case MemberRole.ViewOnly:
      return { text: "Dekhne Wala", variant: "outline" };
  }
}

function roleIcon(role: MemberRole) {
  switch (role) {
    case MemberRole.Admin:
      return <Shield className="w-3 h-3" />;
    case MemberRole.Member:
      return <Pencil className="w-3 h-3" />;
    case MemberRole.ViewOnly:
      return <Eye className="w-3 h-3" />;
  }
}

function formatRelativeDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000; // nanoseconds to ms
  const diff = Date.now() - ms;
  if (diff < 60_000) return "Abhi";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min pehle`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ghante pehle`;
  const d = new Date(ms);
  return d.toLocaleDateString("hi-IN", { day: "numeric", month: "short" });
}

export default function FamilyPage() {
  const navigate = useNavigate();
  const { farm, farmId, isViewOnly, isAdmin } = useFarm();
  const { actor } = useActor();
  const qc = useQueryClient();

  const [showWizard, setShowWizard] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<FarmMember | null>(null);
  const [changeRoleTarget, setChangeRoleTarget] = useState<FarmMember | null>(
    null,
  );
  const [newRole, setNewRole] = useState<MemberRole | null>(null);

  const {
    data: members,
    isLoading,
    isError,
  } = useQuery<FarmMember[]>({
    queryKey: ["farm-members", farmId?.toString()],
    queryFn: async () => {
      if (!actor || !farmId) return [];
      const res = await actor.getFarmMembers(farmId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    enabled: !!actor && !!farmId && !isViewOnly,
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: bigint) => {
      if (!actor || !farmId) throw new Error("Actor not ready");
      const res = await actor.removeFarmMember(farmId, memberId);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farm-members"] });
      toast.success("Sadasya hata diya gaya.");
      setRemoveTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: { memberId: bigint; role: MemberRole }) => {
      if (!actor || !farmId) throw new Error("Actor not ready");
      const res = await actor.updateMemberRole(farmId, memberId, role);
      if (res.__kind__ === "err") throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farm-members"] });
      toast.success("Role badal diya gaya.");
      setChangeRoleTarget(null);
      setNewRole(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Role guard — ViewOnly cannot manage family
  if (isViewOnly) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const adminCount =
    members?.filter((m) => m.role === MemberRole.Admin).length ?? 0;

  return (
    <>
      <div data-ocid="family.page" className="min-h-screen bg-background">
        {/* Page header */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-foreground">
                Parivaar
              </h1>
              {farm && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {farm.name}
                </p>
              )}
            </div>
            {members && (
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {members.length} sadasya
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3 pb-28">
          {/* Loading */}
          {isLoading && (
            <div data-ocid="family.loading_state" className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div
              data-ocid="family.error_state"
              className="text-center py-12 space-y-2"
            >
              <p className="text-sm text-destructive">
                Data load nahi hua. Refresh karein.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && (!members || members.length === 0) && (
            <div
              data-ocid="family.empty_state"
              className="text-center py-16 space-y-4"
            >
              <div className="text-6xl">👨\u200d👩\u200d👦</div>
              <div>
                <p className="font-display text-xl text-foreground">
                  Parivaar Invite Karein
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Abhi tak koi sadasya nahi. Parivaar ko invite karein.
                </p>
              </div>
              {isAdmin && (
                <Button
                  data-ocid="family.add_first_member_button"
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Pehla Sadasya Jodein
                </Button>
              )}
            </div>
          )}

          {/* Member list */}
          {!isLoading &&
            members &&
            members.length > 0 &&
            members.map((member, idx) => {
              const roleMeta = roleLabel(member.role);
              const isSelf = false; // would need principal comparison — safe fallback
              const isLastAdmin =
                member.role === MemberRole.Admin && adminCount === 1;
              return (
                <div
                  key={member.id.toString()}
                  data-ocid={`family.item.${idx + 1}`}
                  className="bg-card rounded-xl border border-border p-4 flex items-start gap-3 transition-colors hover:bg-muted/20"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 border-2 border-primary/20">
                    {member.emoji || "👤"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {member.name}
                      </span>
                      <Badge
                        variant={roleMeta.variant}
                        className="gap-1 text-xs"
                      >
                        {roleIcon(member.role)}
                        {roleMeta.text}
                      </Badge>
                    </div>
                    {member.relation && (
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {member.relation}
                      </p>
                    )}
                    {member.lastActiveAt !== undefined && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Active: {formatRelativeDate(member.lastActiveAt)}
                      </p>
                    )}
                  </div>

                  {/* Options — Admin only */}
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          data-ocid={`family.options_button.${idx + 1}`}
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 rounded-full"
                          aria-label="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          data-ocid={`family.change_role_button.${idx + 1}`}
                          onClick={() => setChangeRoleTarget(member)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Role Badlein
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-ocid={`family.remove_button.${idx + 1}`}
                          className="text-destructive focus:text-destructive"
                          disabled={isLastAdmin || isSelf}
                          onClick={() =>
                            !isLastAdmin && setRemoveTarget(member)
                          }
                        >
                          Hatao{isLastAdmin ? " (Akele Admin)" : ""}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
        </div>

        {/* FAB */}
        {isAdmin && (
          <div className="fixed bottom-20 right-4 z-20">
            <Button
              data-ocid="family.add_member_button"
              type="button"
              size="lg"
              onClick={() => setShowWizard(true)}
              className="rounded-full shadow-xl gap-2 h-14 px-5"
            >
              <UserPlus className="w-5 h-5" />
              <span className="text-sm font-medium">Sadasya Jodein</span>
            </Button>
          </div>
        )}
      </div>

      {/* Add member wizard */}
      {showWizard && (
        <AddMemberWizard
          onClose={() => {
            setShowWizard(false);
            qc.invalidateQueries({ queryKey: ["farm-members"] });
          }}
        />
      )}

      {/* Remove confirm dialog */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent data-ocid="family.remove_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Sadasya Hatao?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{removeTarget?.name}</span> ko
              parivaar se hata diya jayega. Unka access turant band ho jayega.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="family.remove_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="family.remove_confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                removeTarget && removeMutation.mutate(removeTarget.id)
              }
            >
              {removeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Hatao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change role dialog */}
      <AlertDialog
        open={!!changeRoleTarget}
        onOpenChange={(open) => {
          if (!open) {
            setChangeRoleTarget(null);
            setNewRole(null);
          }
        }}
      >
        <AlertDialogContent data-ocid="family.change_role_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Role Badlein</AlertDialogTitle>
            <AlertDialogDescription>
              {changeRoleTarget?.name} ka naaya role chunein:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 py-2 space-y-2">
            {[MemberRole.Admin, MemberRole.Member, MemberRole.ViewOnly].map(
              (r) => (
                <button
                  key={r}
                  type="button"
                  data-ocid={`family.role_option.${r.toLowerCase()}`}
                  onClick={() => setNewRole(r)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    newRole === r
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {roleIcon(r)}
                  <span className="text-sm font-medium">
                    {roleLabel(r).text}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    ({r})
                  </span>
                </button>
              ),
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="family.change_role_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="family.change_role_confirm_button"
              disabled={!newRole || changeRoleMutation.isPending}
              onClick={() =>
                changeRoleTarget &&
                newRole &&
                changeRoleMutation.mutate({
                  memberId: changeRoleTarget.id,
                  role: newRole,
                })
              }
            >
              {changeRoleMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Karein
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
