# Permissions Audit

## Counts
- Sidebar permission modules: 79
- Role page assignable modules detected: 317
- Sidebar modules missing from role assignment page: 6
- Role modules not used by sidebar: 244
- Dashboard pages with explicit usePagePermission/PermissionDenied signals: 0

## Sidebar Modules vs Role Assignment
| module | inRoles | menuLinks |
| --- | --- | --- |
| accounting | true | 54 |
| admin | false | 3 |
| affiliates | true | 1 |
| ai_bank | true | 1 |
| ai_cfo | true | 1 |
| ai_copilot | true | 1 |
| ai_scm | true | 4 |
| approvals | true | 2 |
| attendance | true | 1 |
| audit_logs | true | 4 |
| banks | true | 2 |
| barcode | true | 1 |
| batches | true | 1 |
| bookings | true | 2 |
| branches | true | 1 |
| compliance | false | 4 |
| contracts | false | 1 |
| coupons | true | 1 |
| currencies | true | 1 |
| customers | true | 9 |
| dashboard | true | 2 |
| ecommerce | true | 2 |
| employees | true | 10 |
| esign | true | 1 |
| events | true | 1 |
| expenses | true | 1 |
| field_service | true | 1 |
| fixed_assets | true | 1 |
| fsm | false | 3 |
| gift_cards | true | 1 |
| hr | false | 6 |
| hr_loans | true | 1 |
| installments | true | 1 |
| inventory | false | 1 |
| knowledge | true | 1 |
| legal | true | 10 |
| letters_of_credit | true | 1 |
| lms | true | 1 |
| logistics | true | 2 |
| loyalty | true | 1 |
| maintenance | true | 7 |
| manufacturing | true | 16 |
| master-panel | true | 1 |
| mrp | true | 1 |
| petty_cash | true | 1 |
| pharmacy | true | 4 |
| planning | true | 1 |
| portal | true | 1 |
| pos | true | 3 |
| price_quotes | true | 1 |
| products | true | 1 |
| projects | true | 5 |
| promotions | true | 2 |
| purchase_orders | true | 3 |
| purchase_returns | true | 1 |
| purchases | true | 17 |
| receipt_vouchers | true | 1 |
| rental | true | 1 |
| reports | true | 7 |
| restaurant_pos | true | 1 |
| salaries | true | 4 |
| sales | true | 10 |
| sales_orders | true | 3 |
| sales_returns | true | 2 |
| sales_routes | true | 1 |
| sales_targets | true | 1 |
| schools | true | 3 |
| settings | true | 19 |
| shifts | true | 2 |
| stock | true | 4 |
| stock_transfers | true | 4 |
| subscriptions | true | 1 |
| treasury | true | 4 |
| treasury_checks | true | 1 |
| vacations | true | 2 |
| vision_inventory | true | 1 |
| warehouses | true | 7 |
| whatsapp | true | 1 |
| wms | true | 1 |


## Missing In Role Assignment Page
- admin
- compliance
- contracts
- fsm
- hr
- inventory

## Role Modules Not Used By Sidebar
- 73mod
- adjustments
- aging_report
- ai_coach
- ai_demand
- alerts
- allocation
- allocations
- aps_scheduler
- audit
- audit_grc
- audits
- backup
- bank_imports
- bank_integration
- bank_recon
- bank_recon_auto
- barcodes
- bi_builder
- bi_cube
- bi_dashboard
- blockchain
- bom
- book_cal
- bpm
- budget_ctrl
- budget_scenarios
- budget_variance
- budgets
- calendar
- campaigns
- carriers
- cash_flow
- cash_forecast
- cfo
- cfo_dash
- cfo_dashboard
- chatter
- checks
- classes
- cmms
- coa
- collection_wf
- commissions
- company_info
- compliance_matrix
- consolidation
- contract_templates
- contracts_mgmt
- copa
- copa_rules
- copilot
- cpq
- credit
- credit_check
- custom_fields
- customer360
- customer_statement
- customer_statements_ui
- cx_nps
- dashboard_builder
- dashboard_mfg
- debit_notes
- deferred_rev
- delivery_notes
- digital_twin
- dispatch_board
- dms
- doc_expiry
- drug_interact
- dunning
- e2e_tester
- ecl
- ecommerce_stores
- eos
- expense_reports
- expiry_report
- face_id
- field_audit
- fifo
- fin_health
- fin_reports
- fleet
- fleet_fuel
- fleet_gps
- fleet_trips
- fraud_ai
- fsm_dashboard
- fx_reval
- global_search
- gosi
- grc
- grn
- help_desk
- import_export
- inspections
- interco
- kanban
- kanban_board
- key_accounts
- kpi
- labor_eff
- lc
- leads
- lease_acc
- leases
- leave_mgmt
- leaves
- loans
- maint_wo
- manual_purchases
- marketing_analytics
- mes_oee
- mfg_qc
- movements
- mrp_dash
- mrp_engine
- mrp_recipes
- mudad_compliance
- multi_book
- ncrs
- nitaqat_sim
- nlq
- notifications
- num_seq
- number_sequences
- open_items
- org_chart
- payment_run
- payment_runs
- payroll
- pdpl_breach
- pdpl_dsr
- period_close
- period_lock
- pharmacy_mgr
- pivot_table
- plm_dashboard
- po
- portfolio
- pos_accountant
- pos_offline
- prepayments_ui
- prev_maintenance
- price_compare
- print_templates
- profit_centers
- profit_loss
- project_evm
- prop_inst
- property
- purchase_reqs
- purchases_options
- qc
- qiwa_contracts
- qiwa_sync
- qms_dashboard
- quality_mgmt
- rebates
- recruitment
- recurring
- reorder_rules
- restaurant
- returns_report
- rev_rec
- rfq
- routes
- saas
- sales_analytics
- sales_forecast
- sales_history
- sales_invoices
- sales_options
- sales_quotes
- salla
- saudization
- scheduler
- scm
- segments
- self_service
- serials
- service_sla
- shift_monitor
- shipping
- siem
- smart_map
- smart_transfer
- spend_analytics
- sso_saml
- state_machine
- std_cost
- stocktake
- sub_plans
- subcontracting
- supplier_contracts
- suppliers
- support
- sys_health
- tax_zatca
- tech_tasks
- three_way
- tickets
- timesheet
- training
- transfer
- v2_orchestration
- v3_clinic
- v3_clinic_emr
- v3_construction
- v3_construction_boq
- v3_distribution
- v3_distribution_wms
- v3_mfg
- v3_mfg_mrp
- v3_realestate
- v3_realestate_leases
- v3_restaurant
- v3_restaurant_kds
- v3_retail
- v3_retail_pos
- v3_school
- v3_school_sis
- v3_services
- v3_services_timesheet
- vat_categories
- vat_return
- vendor_portal
- vendor_portal_page
- vendor_scorecard
- vendor_statements
- vision
- vouchers
- wa
- warehouse_opts
- wave_picking
- webhooks
- wht_form14
- wms_map
- work_centers
- work_orders
- workflow_builder
- wps
- year_end_close
- zakat_assessment

## Pages With Explicit Page Permission Hook Signals
| route | modules | usesPermissionDenied | file |
| --- | --- | --- | --- |



## Risk Notes
- Sidebar filtering is not equivalent to route/API authorization. Hidden menu items can still be reached by URL unless page/API protection exists.
- Only 0 dashboard pages showed explicit page-level permission hook signals in static scan.
- API routes must enforce authorization and tenant context independently from UI visibility.
