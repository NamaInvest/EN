
DO $$ 
DECLARE 
    r RECORD;
    cnt_default INTEGER;
    cnt_n11 INTEGER;
    cnt_null INTEGER;
BEGIN 
    RAISE NOTICE '--- n11_db Audit ---';
    FOR r IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_schema = 'public' AND data_type IN ('character varying', 'text')) 
    LOOP 
        EXECUTE 'SELECT count(*) FROM ' || quote_ident(r.table_name) || ' WHERE tenant_id = ''default''' INTO cnt_default;
        EXECUTE 'SELECT count(*) FROM ' || quote_ident(r.table_name) || ' WHERE tenant_id = ''n11''' INTO cnt_n11;
        EXECUTE 'SELECT count(*) FROM ' || quote_ident(r.table_name) || ' WHERE tenant_id IS NULL OR tenant_id = ''''' INTO cnt_null;
        
        IF cnt_default > 0 OR cnt_n11 > 0 OR cnt_null > 0 THEN
            RAISE NOTICE 'Table: % | default: % | n11: % | NULL/Empty: %', r.table_name, cnt_default, cnt_n11, cnt_null;
        END IF;
    END LOOP; 
END $$;
