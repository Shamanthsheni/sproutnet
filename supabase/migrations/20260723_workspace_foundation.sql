-- SproutNet Migration: Workspace Foundation — Phase 1
-- Date: 2026-07-23
-- 
-- Extends existing schema to make Workspace the central collaboration entity.
-- All existing tables and columns are preserved; only ADD operations are used.

-- 1. EXTEND EXISTING TABLES
-- ============================================

-- 1a. workspaces — add full metadata
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'forming', 'active', 'submitted', 'completed', 'archived', 'disbanded')),
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'team' CHECK (visibility IN ('team', 'public')),
  ADD COLUMN IF NOT EXISTS max_members INT NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS max_mentors INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill workspace names from linked team names
UPDATE public.workspaces w
SET name = COALESCE((SELECT t.name FROM public.teams t WHERE t.id = w.team_id), 'Workspace')
WHERE w.name = '';

-- 1b. team_members — add workspace_id FK and expand role
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Backfill workspace_id from teams->workspace relationship
UPDATE public.team_members tm
SET workspace_id = (SELECT w.id FROM public.workspaces w WHERE w.team_id = tm.team_id)
WHERE tm.workspace_id IS NULL;

-- Relax role constraint (we keep existing values and add new ones)
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('leader', 'co_leader', 'member', 'mentor', 'poster'));

-- 1c. mentor_assignments — add tracking metadata
ALTER TABLE public.mentor_assignments
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignment_status TEXT NOT NULL DEFAULT 'active' CHECK (assignment_status IN ('active', 'ended')),
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_reason TEXT;

-- 1d. messages — add message_type, edit/delete tracking, metadata
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'announcement')),
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 1e. conversation_members — add unread_count and notification prefs
ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS unread_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- 1f. conversations — expand type check to include 'system'
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_type_check
  CHECK (type IN ('channel', 'dm', 'group_dm', 'announcement', 'system'));

-- 1g. team_invites and team_join_requests — add workspace_id
ALTER TABLE public.team_invites
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.team_join_requests
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- 2. NEW TABLES
-- ============================================

-- 2a. workspace_milestones
CREATE TABLE IF NOT EXISTS public.workspace_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  due_date TIMESTAMPTZ,
  completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2b. workspace_announcements
CREATE TABLE IF NOT EXISTS public.workspace_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'general' CHECK (announcement_type IN ('general', 'poster', 'system', 'deadline')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2c. workspace_progress (cached progress per workspace)
CREATE TABLE IF NOT EXISTS public.workspace_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_stage TEXT NOT NULL DEFAULT 'ideation' CHECK (current_stage IN ('ideation', 'planning', 'development', 'testing', 'submission', 'reviewed')),
  last_submission_at TIMESTAMPTZ,
  reviewer_feedback TEXT,
  poster_feedback TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2d. audit_logs (platform-level admin audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2e. workspace_invites (workspace-scoped invites)
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'co_leader')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2f. workspace_roles (role registry)
CREATE TABLE IF NOT EXISTS public.workspace_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('leader', 'co_leader', 'member', 'mentor', 'poster', 'admin')),
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert system roles
INSERT INTO public.workspace_roles (name, description, is_system) VALUES
  ('leader', 'Full workspace control — manage members, settings, and all resources', true),
  ('co_leader', 'Elevated permissions — invite, manage milestones, post announcements', true),
  ('member', 'Standard workspace member — read, upload files, update own milestones', true),
  ('mentor', 'Workspace mentor — guide progress, provide feedback, read all resources', true),
  ('poster', 'Problem poster — read-only workspace access, post announcements, give feedback', true),
  ('admin', 'Platform administrator — full access to all workspaces', true)
ON CONFLICT (name) DO NOTHING;

-- 2g. workspace_role_permissions (maps roles to granular permissions)
CREATE TABLE IF NOT EXISTS public.workspace_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.workspace_roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  UNIQUE(role_id, permission)
);

-- Insert default permissions for each role
DO $$
DECLARE
  v_leader_id UUID;
  v_co_leader_id UUID;
  v_member_id UUID;
  v_mentor_id UUID;
  v_poster_id UUID;
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_leader_id FROM public.workspace_roles WHERE name = 'leader';
  SELECT id INTO v_co_leader_id FROM public.workspace_roles WHERE name = 'co_leader';
  SELECT id INTO v_member_id FROM public.workspace_roles WHERE name = 'member';
  SELECT id INTO v_mentor_id FROM public.workspace_roles WHERE name = 'mentor';
  SELECT id INTO v_poster_id FROM public.workspace_roles WHERE name = 'poster';
  SELECT id INTO v_admin_id FROM public.workspace_roles WHERE name = 'admin';

  -- Leader permissions
  INSERT INTO public.workspace_role_permissions (role_id, permission) VALUES
    (v_leader_id, 'workspace.read'),
    (v_leader_id, 'workspace.update'),
    (v_leader_id, 'workspace.delete'),
    (v_leader_id, 'workspace.invite'),
    (v_leader_id, 'workspace.remove_member'),
    (v_leader_id, 'workspace.manage_roles'),
    (v_leader_id, 'workspace.create_channel'),
    (v_leader_id, 'workspace.delete_channel'),
    (v_leader_id, 'workspace.upload_file'),
    (v_leader_id, 'workspace.delete_file'),
    (v_leader_id, 'workspace.create_milestone'),
    (v_leader_id, 'workspace.update_milestone'),
    (v_leader_id, 'workspace.delete_milestone'),
    (v_leader_id, 'workspace.post_announcement'),
    (v_leader_id, 'workspace.delete_announcement'),
    (v_leader_id, 'workspace.assign_mentor'),
    (v_leader_id, 'workspace.remove_mentor'),
    (v_leader_id, 'workspace.manage_settings'),
    (v_leader_id, 'workspace.transfer_leadership')
  ON CONFLICT DO NOTHING;

  -- Co-leader permissions
  INSERT INTO public.workspace_role_permissions (role_id, permission) VALUES
    (v_co_leader_id, 'workspace.read'),
    (v_co_leader_id, 'workspace.update'),
    (v_co_leader_id, 'workspace.invite'),
    (v_co_leader_id, 'workspace.remove_member'),
    (v_co_leader_id, 'workspace.create_channel'),
    (v_co_leader_id, 'workspace.upload_file'),
    (v_co_leader_id, 'workspace.delete_file'),
    (v_co_leader_id, 'workspace.create_milestone'),
    (v_co_leader_id, 'workspace.update_milestone'),
    (v_co_leader_id, 'workspace.delete_milestone'),
    (v_co_leader_id, 'workspace.post_announcement'),
    (v_co_leader_id, 'workspace.manage_settings')
  ON CONFLICT DO NOTHING;

  -- Member permissions
  INSERT INTO public.workspace_role_permissions (role_id, permission) VALUES
    (v_member_id, 'workspace.read'),
    (v_member_id, 'workspace.upload_file'),
    (v_member_id, 'workspace.read_milestones'),
    (v_member_id, 'workspace.update_milestone')
  ON CONFLICT DO NOTHING;

  -- Mentor permissions
  INSERT INTO public.workspace_role_permissions (role_id, permission) VALUES
    (v_mentor_id, 'workspace.read'),
    (v_mentor_id, 'workspace.upload_file'),
    (v_mentor_id, 'workspace.read_milestones'),
    (v_mentor_id, 'workspace.update_milestone'),
    (v_mentor_id, 'workspace.manage_progress')
  ON CONFLICT DO NOTHING;

  -- Poster permissions
  INSERT INTO public.workspace_role_permissions (role_id, permission) VALUES
    (v_poster_id, 'workspace.read'),
    (v_poster_id, 'workspace.read_milestones'),
    (v_poster_id, 'workspace.manage_progress'),
    (v_poster_id, 'workspace.post_announcement')
  ON CONFLICT DO NOTHING;

  -- Admin permissions (all)
  INSERT INTO public.workspace_role_permissions (role_id, permission) VALUES
    (v_admin_id, '*')
  ON CONFLICT DO NOTHING;
END $$;

-- 3. NEW INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.team_members(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.team_members(user_id, workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_workspace_role ON public.team_members(workspace_id, role);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_files_category ON public.workspace_files(workspace_id, category);
CREATE INDEX IF NOT EXISTS idx_workspace_milestones_workspace ON public.workspace_milestones(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_milestones_status ON public.workspace_milestones(status);
CREATE INDEX IF NOT EXISTS idx_workspace_milestones_due ON public.workspace_milestones(workspace_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspace_announcements_workspace ON public.workspace_announcements(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_announcements_pinned ON public.workspace_announcements(workspace_id) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON public.workspace_invites(email);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_active ON public.messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);

-- 4. COMPREHENSIVE ROW LEVEL SECURITY
-- ============================================

-- Helper function to get effective workspace role
CREATE OR REPLACE FUNCTION public.get_workspace_role(p_user_id UUID, p_workspace_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check team_members (workspace members)
  SELECT tm.role INTO v_role
  FROM public.team_members tm
  WHERE tm.user_id = p_user_id AND tm.workspace_id = p_workspace_id
  LIMIT 1;

  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- Check mentor_assignments via team->workspace link
  IF EXISTS (
    SELECT 1 FROM public.mentor_assignments ma
    JOIN public.workspaces w ON w.team_id = ma.team_id
    WHERE ma.mentor_id = p_user_id AND w.id = p_workspace_id
    AND ma.assignment_status = 'active'
  ) THEN
    RETURN 'mentor';
  END IF;

  -- Check if user is platform admin
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND (role = 'admin' OR is_master = true)) THEN
    RETURN 'admin';
  END IF;

  RETURN NULL;
END $$;

-- Helper function to check workspace permission
CREATE OR REPLACE FUNCTION public.check_workspace_permission(
  p_user_id UUID,
  p_workspace_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Platform admins have all permissions
  SELECT (role = 'admin' OR is_master = true) INTO v_is_admin
  FROM public.users WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Get workspace role
  v_role := public.get_workspace_role(p_user_id, p_workspace_id);

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- Check if role has the required permission (or wildcard)
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_role_permissions wrp
    JOIN public.workspace_roles wr ON wr.id = wrp.role_id
    WHERE wr.name = v_role
    AND (wrp.permission = p_permission OR wrp.permission = '*')
  );
END $$;

-- Enable RLS on new tables
ALTER TABLE public.workspace_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'workspace_select_member') THEN
    CREATE POLICY "workspace_select_member" ON public.workspaces
      FOR SELECT USING (
        public.get_workspace_role(auth.uid(), id) IS NOT NULL
        OR visibility = 'public'
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'workspace_update_leader') THEN
    CREATE POLICY "workspace_update_leader" ON public.workspaces
      FOR UPDATE USING (
        public.check_workspace_permission(auth.uid(), id, 'workspace.update')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'workspace_delete_admin') THEN
    CREATE POLICY "workspace_delete_admin" ON public.workspaces
      FOR DELETE USING (
        public.check_workspace_permission(auth.uid(), id, 'workspace.delete')
      );
  END IF;
END $$;

-- RLS Policies for workspace_milestones
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_milestones' AND policyname = 'milestone_select_member') THEN
    CREATE POLICY "milestone_select_member" ON public.workspace_milestones
      FOR SELECT USING (
        public.get_workspace_role(auth.uid(), workspace_id) IS NOT NULL
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_milestones' AND policyname = 'milestone_insert_leader') THEN
    CREATE POLICY "milestone_insert_leader" ON public.workspace_milestones
      FOR INSERT WITH CHECK (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.create_milestone')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_milestones' AND policyname = 'milestone_update_member') THEN
    CREATE POLICY "milestone_update_member" ON public.workspace_milestones
      FOR UPDATE USING (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.update_milestone')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_milestones' AND policyname = 'milestone_delete_leader') THEN
    CREATE POLICY "milestone_delete_leader" ON public.workspace_milestones
      FOR DELETE USING (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.delete_milestone')
      );
  END IF;
END $$;

-- RLS Policies for workspace_announcements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_announcements' AND policyname = 'announcement_select_member') THEN
    CREATE POLICY "announcement_select_member" ON public.workspace_announcements
      FOR SELECT USING (
        public.get_workspace_role(auth.uid(), workspace_id) IS NOT NULL
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_announcements' AND policyname = 'announcement_insert_poster') THEN
    CREATE POLICY "announcement_insert_poster" ON public.workspace_announcements
      FOR INSERT WITH CHECK (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.post_announcement')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_announcements' AND policyname = 'announcement_delete_author') THEN
    CREATE POLICY "announcement_delete_author" ON public.workspace_announcements
      FOR DELETE USING (
        auth.uid() = author_id
        OR public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.delete_announcement')
      );
  END IF;
END $$;

-- RLS Policies for workspace_progress
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_progress' AND policyname = 'progress_select_member') THEN
    CREATE POLICY "progress_select_member" ON public.workspace_progress
      FOR SELECT USING (
        public.get_workspace_role(auth.uid(), workspace_id) IS NOT NULL
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_progress' AND policyname = 'progress_update_mentor') THEN
    CREATE POLICY "progress_update_mentor" ON public.workspace_progress
      FOR UPDATE USING (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.manage_progress')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_progress' AND policyname = 'progress_insert_admin') THEN
    CREATE POLICY "progress_insert_admin" ON public.workspace_progress
      FOR INSERT WITH CHECK (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.manage_progress')
      );
  END IF;
END $$;

-- RLS Policies for workspace_files (extend existing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_files' AND policyname = 'workspace_files_select_member') THEN
    CREATE POLICY "workspace_files_select_member" ON public.workspace_files
      FOR SELECT USING (
        public.get_workspace_role(auth.uid(), workspace_id) IS NOT NULL
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_files' AND policyname = 'workspace_files_insert_member') THEN
    CREATE POLICY "workspace_files_insert_member" ON public.workspace_files
      FOR INSERT WITH CHECK (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.upload_file')
        AND auth.uid() = uploader_id
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_files' AND policyname = 'workspace_files_delete_owner') THEN
    CREATE POLICY "workspace_files_delete_owner" ON public.workspace_files
      FOR DELETE USING (
        auth.uid() = uploader_id
        OR public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.delete_file')
      );
  END IF;
END $$;

-- RLS Policies for workspace_invites
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invites' AND policyname = 'workspace_invites_select_leader') THEN
    CREATE POLICY "workspace_invites_select_leader" ON public.workspace_invites
      FOR SELECT USING (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.invite')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_invites' AND policyname = 'workspace_invites_insert_leader') THEN
    CREATE POLICY "workspace_invites_insert_leader" ON public.workspace_invites
      FOR INSERT WITH CHECK (
        public.check_workspace_permission(auth.uid(), workspace_id, 'workspace.invite')
      );
  END IF;
END $$;

-- RLS Policies for team_members (extend existing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_select_self') THEN
    CREATE POLICY "team_members_select_self" ON public.team_members
      FOR SELECT USING (
        user_id = auth.uid()
        OR (workspace_id IS NOT NULL AND public.get_workspace_role(auth.uid(), workspace_id) IS NOT NULL)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_insert_leader') THEN
    CREATE POLICY "team_members_insert_leader" ON public.team_members
      FOR INSERT WITH CHECK (
        workspace_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.team_members tm2
          WHERE tm2.workspace_id = workspace_id
          AND tm2.user_id = auth.uid()
          AND tm2.role IN ('leader', 'co_leader')
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_update_leader') THEN
    CREATE POLICY "team_members_update_leader" ON public.team_members
      FOR UPDATE USING (
        workspace_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.team_members tm2
          WHERE tm2.workspace_id = workspace_id
          AND tm2.user_id = auth.uid()
          AND tm2.role = 'leader'
        )
      );
  END IF;
END $$;

-- Policies for existing tables that lacked comprehensive RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_invites' AND policyname = 'team_invites_select_member') THEN
    CREATE POLICY "team_invites_select_member" ON public.team_invites
      FOR SELECT USING (
        auth.uid() = invited_by
        OR (workspace_id IS NOT NULL AND public.get_workspace_role(auth.uid(), workspace_id) IS NOT NULL)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mentor_assignments' AND policyname = 'mentor_assignments_select_member') THEN
    CREATE POLICY "mentor_assignments_select_member" ON public.mentor_assignments
      FOR SELECT USING (
        mentor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          JOIN public.workspaces w ON w.team_id = mentor_assignments.team_id
          WHERE tm.workspace_id = w.id AND tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 5. STORAGE BUCKET FOR WORKSPACE FILES (ensure exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('workspace-files', 'workspace-files', true, 31457280, ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for workspace-files storage bucket
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Workspace Files Public Read') THEN
    CREATE POLICY "Workspace Files Public Read" ON storage.objects
      FOR SELECT USING (bucket_id = 'workspace-files');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Workspace Files Upload') THEN
    CREATE POLICY "Workspace Files Upload" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'workspace-files'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;
