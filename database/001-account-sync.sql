-- Additive app namespace. Existing Neon Auth users and study_private data are untouched.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='engineer_service') THEN
    CREATE ROLE engineer_service NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  EXECUTE format('GRANT engineer_service TO %I',current_user);
END $$;
CREATE SCHEMA engineer_private AUTHORIZATION engineer_service;
REVOKE ALL ON SCHEMA engineer_private FROM PUBLIC,authenticated,anonymous;
GRANT USAGE ON SCHEMA engineer_private TO authenticated;
CREATE FUNCTION engineer_private.current_user_id() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.user_id() $$;
REVOKE ALL ON FUNCTION engineer_private.current_user_id() FROM PUBLIC,authenticated,anonymous;
GRANT EXECUTE ON FUNCTION engineer_private.current_user_id() TO engineer_service;
CREATE FUNCTION engineer_private.initialize_identity() RETURNS text LANGUAGE sql STABLE SECURITY INVOKER BEGIN ATOMIC SELECT auth.user_id(); END;
REVOKE ALL ON FUNCTION engineer_private.initialize_identity() FROM PUBLIC,anonymous;
GRANT EXECUTE ON FUNCTION engineer_private.initialize_identity() TO authenticated;
GRANT USAGE ON SCHEMA neon_auth TO engineer_service;
GRANT SELECT(id,"emailVerified"), REFERENCES(id) ON neon_auth."user" TO engineer_service;
GRANT USAGE,CREATE ON SCHEMA public TO engineer_service;
SET LOCAL ROLE engineer_service;
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
CREATE TABLE engineer_private.questions(code text PRIMARY KEY);
CREATE TABLE engineer_private.progress(
  user_id text PRIMARY KEY,
  auth_user_id uuid GENERATED ALWAYS AS(user_id::uuid) STORED REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  epoch uuid NOT NULL DEFAULT gen_random_uuid(),revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
  body jsonb NOT NULL CHECK(octet_length(body::text)<=4500000),
  rate_window timestamptz NOT NULL DEFAULT now(),rate_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE engineer_private.receipts(
  user_id text NOT NULL REFERENCES engineer_private.progress(user_id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,fingerprint text NOT NULL,accepted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(user_id,operation_id)
);
CREATE INDEX receipt_owner_time ON engineer_private.receipts(user_id,accepted_at DESC);
ALTER TABLE engineer_private.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_private.progress FORCE ROW LEVEL SECURITY;
ALTER TABLE engineer_private.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_private.receipts FORCE ROW LEVEL SECURITY;
CREATE POLICY own_progress ON engineer_private.progress TO engineer_service USING(user_id=(SELECT engineer_private.current_user_id())) WITH CHECK(user_id=(SELECT engineer_private.current_user_id()));
CREATE POLICY own_receipts ON engineer_private.receipts TO engineer_service USING(user_id=(SELECT engineer_private.current_user_id())) WITH CHECK(user_id=(SELECT engineer_private.current_user_id()));
CREATE FUNCTION engineer_private.empty_state() RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT '{"version":1,"settings":{"minutes":30,"target":"2026","examDate":""},"attempts":[],"bookmarks":[],"sessions":[],"active":null}'::jsonb $$;
CREATE FUNCTION engineer_private.shape(v jsonb,keys text[]) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
BEGIN IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR NOT(v ?& keys) OR EXISTS(SELECT 1 FROM jsonb_object_keys(v) k WHERE NOT k=ANY(keys)) THEN RAISE EXCEPTION 'INVALID_FIELDS' USING ERRCODE='22023'; END IF; END $$;
CREATE FUNCTION engineer_private.uuid(v jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT coalesce(jsonb_typeof(v)='string' AND (v#>>'{}')~*'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',false) $$;
CREATE FUNCTION engineer_private.integer(v jsonb,lim bigint) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT coalesce(jsonb_typeof(v)='number' AND (v#>>'{}')~'^[0-9]{1,16}$' AND (v#>>'{}')::numeric BETWEEN 0 AND lim,false) $$;
CREATE FUNCTION engineer_private.date(v jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$ BEGIN RETURN coalesce(jsonb_typeof(v)='string' AND (v#>>'{}')~'^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$' AND to_char((v#>>'{}')::timestamptz AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')=v#>>'{}',false); EXCEPTION WHEN OTHERS THEN RETURN false; END $$;
CREATE FUNCTION engineer_private.array_bound(v jsonb,lim integer) RETURNS void LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$ BEGIN IF jsonb_typeof(v) IS DISTINCT FROM 'array' OR jsonb_array_length(v)>lim THEN RAISE EXCEPTION 'INVALID_ARRAY' USING ERRCODE='22023'; END IF; END $$;
CREATE FUNCTION engineer_private.valid_session(s jsonb,active boolean) RETURNS void LANGUAGE plpgsql STABLE SET search_path='' AS $$
DECLARE q jsonb; v jsonb;
BEGIN
  PERFORM engineer_private.shape(s,CASE WHEN active THEN ARRAY['id','mode','startedAt','deadline','codes','answers','flagged','index'] ELSE ARRAY['id','mode','endedAt','codes','answers','score','seconds'] END);
  IF NOT engineer_private.uuid(s->'id') OR coalesce(s->>'mode','') NOT IN('mock','diagnostic') THEN RAISE EXCEPTION 'INVALID_SESSION' USING ERRCODE='22023'; END IF;
  PERFORM engineer_private.array_bound(s->'codes',20);PERFORM engineer_private.array_bound(s->'answers',20);
  IF jsonb_array_length(s->'codes')<>20 OR jsonb_array_length(s->'answers')<>20 OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(s->'codes'))<>20 THEN RAISE EXCEPTION 'INVALID_SESSION' USING ERRCODE='22023'; END IF;
  FOR q IN SELECT value FROM jsonb_array_elements(s->'codes') LOOP IF jsonb_typeof(q)<>'string' OR NOT EXISTS(SELECT 1 FROM engineer_private.questions WHERE code=q#>>'{}') THEN RAISE EXCEPTION 'INVALID_CODE' USING ERRCODE='22023'; END IF; END LOOP;
  FOR v IN SELECT value FROM jsonb_array_elements(s->'answers') LOOP IF jsonb_typeof(v)<>'string' OR length(v#>>'{}')>1200 THEN RAISE EXCEPTION 'INVALID_ANSWER' USING ERRCODE='22023'; END IF; END LOOP;
  IF active THEN
    PERFORM engineer_private.array_bound(s->'flagged',20);
    IF NOT engineer_private.date(s->'startedAt') OR NOT engineer_private.integer(s->'index',19)
      OR (s->>'mode'='diagnostic' AND s->'deadline'<>'null'::jsonb)
      OR (s->>'mode'='mock' AND (NOT engineer_private.integer(s->'deadline',8640000000000000) OR (s->>'deadline')::numeric<>extract(epoch FROM (s->>'startedAt')::timestamptz)*1000+9000000))
      OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(s->'flagged'))<>jsonb_array_length(s->'flagged') THEN RAISE EXCEPTION 'INVALID_SESSION_TIME' USING ERRCODE='22023'; END IF;
    FOR v IN SELECT value FROM jsonb_array_elements(s->'flagged') LOOP IF NOT engineer_private.integer(v,19) THEN RAISE EXCEPTION 'INVALID_FLAG' USING ERRCODE='22023'; END IF; END LOOP;
  ELSE
    IF NOT engineer_private.date(s->'endedAt') OR NOT engineer_private.integer(s->'seconds',86400) OR NOT engineer_private.integer(s->'score',100) OR (s->>'score')::integer%5<>0 THEN RAISE EXCEPTION 'INVALID_SCORE' USING ERRCODE='22023'; END IF;
  END IF;
END $$;
CREATE FUNCTION engineer_private.validate_state(s jsonb) RETURNS void LANGUAGE plpgsql STABLE SET search_path='' AS $$
DECLARE a jsonb; c jsonb; d text;
BEGIN
  PERFORM engineer_private.shape(s,ARRAY['version','settings','attempts','bookmarks','sessions','active']);
  PERFORM engineer_private.shape(s->'settings',ARRAY['minutes','target','examDate']);
  d:=s->'settings'->>'examDate';
  IF s->'version'<>'1'::jsonb OR (s->'settings'->'minutes') NOT IN('15'::jsonb,'30'::jsonb,'60'::jsonb) OR s->'settings'->'target'<>'"2026"'::jsonb OR jsonb_typeof(s->'settings'->'examDate')<>'string' OR (d<>'' AND (d!~'^20\d\d-\d\d-\d\d$' OR to_char(d::date,'YYYY-MM-DD')<>d)) OR octet_length(s::text)>4500000 THEN RAISE EXCEPTION 'INVALID_STATE' USING ERRCODE='22023'; END IF;
  PERFORM engineer_private.array_bound(s->'attempts',2048);PERFORM engineer_private.array_bound(s->'bookmarks',128);PERFORM engineer_private.array_bound(s->'sessions',20);
  IF (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(s->'attempts'))<>jsonb_array_length(s->'attempts') OR (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(s->'sessions'))<>jsonb_array_length(s->'sessions') OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(s->'bookmarks'))<>jsonb_array_length(s->'bookmarks') THEN RAISE EXCEPTION 'DUPLICATE_RECORD' USING ERRCODE='22023'; END IF;
  FOR a IN SELECT value FROM jsonb_array_elements(s->'attempts') LOOP
    PERFORM engineer_private.shape(a,ARRAY['id','code','answer','correct','hinted','confidence','elapsed','at','cause']);
    IF NOT engineer_private.uuid(a->'id') OR NOT EXISTS(SELECT 1 FROM engineer_private.questions WHERE code=a->>'code') OR jsonb_typeof(a->'code')<>'string' OR jsonb_typeof(a->'answer')<>'string' OR length(a->>'answer')>1200 OR jsonb_typeof(a->'correct')<>'boolean' OR jsonb_typeof(a->'hinted')<>'boolean' OR coalesce(a->>'confidence','') NOT IN('sure','unsure','guess') OR NOT engineer_private.integer(a->'elapsed',86400000) OR NOT engineer_private.date(a->'at') OR coalesce(a->>'cause','') NOT IN('none','concept','trace','calculation','term','format') THEN RAISE EXCEPTION 'INVALID_ATTEMPT' USING ERRCODE='22023'; END IF;
  END LOOP;
  FOR c IN SELECT value FROM jsonb_array_elements(s->'bookmarks') LOOP IF jsonb_typeof(c)<>'string' OR NOT EXISTS(SELECT 1 FROM engineer_private.questions WHERE code=c#>>'{}') THEN RAISE EXCEPTION 'INVALID_CODE' USING ERRCODE='22023'; END IF; END LOOP;
  FOR a IN SELECT value FROM jsonb_array_elements(s->'sessions') LOOP PERFORM engineer_private.valid_session(a,false); END LOOP;
  IF s->'active'<>'null'::jsonb THEN
    PERFORM engineer_private.valid_session(s->'active',true);
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(s->'sessions') v WHERE v->>'id'=s->'active'->>'id') THEN RAISE EXCEPTION 'FINISHED_SESSION' USING ERRCODE='22023'; END IF;
  END IF;
END $$;
CREATE FUNCTION engineer_private.envelope(p engineer_private.progress) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$ SELECT jsonb_build_object('appId','engineer-practice','userId',p.user_id,'epoch',p.epoch,'revision',p.revision,'state',p.body,'serverNow',floor(extract(epoch FROM now())*1000)) $$;
CREATE FUNCTION engineer_private.operate(p_request jsonb,kind text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid text:=engineer_private.current_user_id();p engineer_private.progress;receipt engineer_private.receipts;fp text;
BEGIN
  IF kind NOT IN('pull','push','reset') OR kind IS NULL THEN RAISE EXCEPTION 'INVALID_OPERATION' USING ERRCODE='22023'; END IF;
  IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM neon_auth."user" WHERE id=uid::uuid AND "emailVerified"=true) OR p_request->>'userId' IS DISTINCT FROM uid THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='28000'; END IF;
  PERFORM engineer_private.shape(p_request,ARRAY['appId','userId']||CASE WHEN kind='pull' THEN '{}'::text[] WHEN kind='push' THEN ARRAY['epoch','baseRevision','operationId','state'] ELSE ARRAY['epoch','baseRevision','operationId'] END);
  IF p_request->>'appId' IS DISTINCT FROM 'engineer-practice' THEN RAISE EXCEPTION 'INVALID_APP' USING ERRCODE='22023'; END IF;
  INSERT INTO engineer_private.progress(user_id,body) VALUES(uid,engineer_private.empty_state()) ON CONFLICT DO NOTHING;
  SELECT * INTO p FROM engineer_private.progress WHERE user_id=uid FOR UPDATE;
  IF p.rate_window<now()-interval '1 minute' THEN p.rate_window:=now();p.rate_count:=0;END IF;
  IF p.rate_count>=120 THEN RAISE EXCEPTION 'RATE_LIMIT' USING ERRCODE='P0001'; END IF;
  UPDATE engineer_private.progress SET rate_window=p.rate_window,rate_count=p.rate_count+1 WHERE user_id=uid;
  IF kind='pull' THEN RETURN engineer_private.envelope(p); END IF;
  IF NOT engineer_private.uuid(p_request->'epoch') OR NOT engineer_private.uuid(p_request->'operationId') OR NOT engineer_private.integer(p_request->'baseRevision',9007199254740991) THEN RAISE EXCEPTION 'INVALID_REQUEST' USING ERRCODE='22023'; END IF;
  fp:=encode(sha256(convert_to(kind||p_request::text,'UTF8')),'hex');
  SELECT * INTO receipt FROM engineer_private.receipts WHERE user_id=uid AND operation_id=(p_request->>'operationId')::uuid;
  IF FOUND THEN
    IF receipt.fingerprint<>fp THEN RAISE EXCEPTION 'OPERATION_REUSED' USING ERRCODE='22023';END IF;
    RETURN jsonb_build_object('status','ok','cloud',engineer_private.envelope(p));
  END IF;
  IF (p_request->>'epoch')::uuid<>p.epoch THEN RETURN jsonb_build_object('status','epoch','cloud',engineer_private.envelope(p)); END IF;
  IF (p_request->>'baseRevision')::bigint<>p.revision THEN RETURN jsonb_build_object('status','conflict','cloud',engineer_private.envelope(p)); END IF;
  IF kind='push' THEN
    PERFORM engineer_private.validate_state(p_request->'state');
    UPDATE engineer_private.progress SET body=p_request->'state',revision=revision+1,updated_at=now() WHERE user_id=uid RETURNING * INTO p;
  ELSE
    DELETE FROM engineer_private.receipts WHERE user_id=uid;
    UPDATE engineer_private.progress SET body=engineer_private.empty_state(),epoch=gen_random_uuid(),revision=revision+1,updated_at=now() WHERE user_id=uid RETURNING * INTO p;
  END IF;
  INSERT INTO engineer_private.receipts(user_id,operation_id,fingerprint) VALUES(uid,(p_request->>'operationId')::uuid,fp);
  DELETE FROM engineer_private.receipts WHERE user_id=uid AND operation_id IN(SELECT operation_id FROM engineer_private.receipts WHERE user_id=uid ORDER BY accepted_at DESC,operation_id OFFSET 128);
  RETURN jsonb_build_object('status','ok','cloud',engineer_private.envelope(p));
END $$;
RESET ROLE;
REVOKE ALL ON ALL TABLES IN SCHEMA engineer_private FROM PUBLIC,authenticated,anonymous;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA engineer_private FROM PUBLIC,authenticated,anonymous;
GRANT EXECUTE ON FUNCTION engineer_private.initialize_identity(),engineer_private.operate(jsonb,text) TO authenticated;
-- Kind cannot be supplied by clients through a public entry point; enforce allowlist too.
RESET ROLE;
CREATE FUNCTION public.engineer_pull(p_request jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN PERFORM engineer_private.initialize_identity(); RETURN engineer_private.operate(p_request,'pull'); END $$;
CREATE FUNCTION public.engineer_push(p_request jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN PERFORM engineer_private.initialize_identity(); RETURN engineer_private.operate(p_request,'push'); END $$;
CREATE FUNCTION public.engineer_reset(p_request jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN PERFORM engineer_private.initialize_identity(); RETURN engineer_private.operate(p_request,'reset'); END $$;
REVOKE ALL ON FUNCTION public.engineer_pull(jsonb),public.engineer_push(jsonb),public.engineer_reset(jsonb) FROM PUBLIC,anonymous;
GRANT EXECUTE ON FUNCTION public.engineer_pull(jsonb),public.engineer_push(jsonb),public.engineer_reset(jsonb) TO authenticated;
REVOKE CREATE ON SCHEMA public FROM engineer_service;
COMMIT;
