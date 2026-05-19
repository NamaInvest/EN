
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id' AND table_schema = 'public' AND data_type IN ('character varying', 'text')) 
    LOOP 
        EXECUTE 'UPDATE ' || quote_ident(r.table_name) || ' SET tenant_id = ''n1'' WHERE tenant_id = ''default'''; 
    END LOOP; 
END $$;
