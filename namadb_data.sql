--
-- PostgreSQL database dump
--

\restrict bfJALwbhUw50FjzIAuTo9U2QwBtmF5ECuMmKcgJgDjlAIIJ6VRhbiKPCUcPuRuL

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.accounts VALUES (1, '1000', 'الأصول', 'Assets', 'asset', 0, 1, true, 0);
INSERT INTO public.accounts VALUES (2, '1100', 'النقدية والبنوك', 'Cash & Banks', 'asset', 1, 2, true, 0);
INSERT INTO public.accounts VALUES (3, '1200', 'المدينون', 'Receivables', 'asset', 1, 2, true, 0);
INSERT INTO public.accounts VALUES (4, '1300', 'المخزون', 'Inventory', 'asset', 1, 2, true, 0);
INSERT INTO public.accounts VALUES (5, '2000', 'الخصوم', 'Liabilities', 'liability', 0, 1, true, 0);
INSERT INTO public.accounts VALUES (6, '2100', 'الدائنون', 'Payables', 'liability', 5, 2, true, 0);
INSERT INTO public.accounts VALUES (7, '2200', 'القروض', 'Loans', 'liability', 5, 2, true, 0);
INSERT INTO public.accounts VALUES (8, '3000', 'حقوق الملكية', 'Equity', 'equity', 0, 1, true, 0);
INSERT INTO public.accounts VALUES (9, '3100', 'رأس المال', 'Capital', 'equity', 8, 2, true, 0);
INSERT INTO public.accounts VALUES (10, '4000', 'الإيرادات', 'Revenue', 'revenue', 0, 1, true, 0);
INSERT INTO public.accounts VALUES (11, '4100', 'المبيعات', 'Sales', 'revenue', 10, 2, true, 0);
INSERT INTO public.accounts VALUES (12, '4200', 'إيرادات أخرى', 'Other Revenue', 'revenue', 10, 2, true, 0);
INSERT INTO public.accounts VALUES (13, '5000', 'المصروفات', 'Expenses', 'expense', 0, 1, true, 0);
INSERT INTO public.accounts VALUES (14, '5100', 'تكلفة البضاعة', 'COGS', 'expense', 13, 2, true, 0);
INSERT INTO public.accounts VALUES (15, '5200', 'الرواتب', 'Salaries', 'expense', 13, 2, true, 0);
INSERT INTO public.accounts VALUES (16, '5300', 'الإيجار', 'Rent', 'expense', 13, 2, true, 0);
INSERT INTO public.accounts VALUES (17, '5400', 'مصروفات عامة', 'General Expenses', 'expense', 13, 2, true, 0);


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.users VALUES (1, 'admin', '$2b$10$b8UOi4kr9.BPhvo8i2w/qOJc9Mtv67AMpF5T1TiL1kqyW1D5AoXTq', 'مدير النظام', 'admin', '', true, '9c712ffd-b376-46fe-9333-e94d66e675d8', '2026-03-09 00:13:43.604', NULL, NULL, NULL, NULL);
INSERT INTO public.users VALUES (2, '1', '$2b$10$WkiyTOY.kdLvbR3YIx5fnuodc57nHIl0wMCHrFIWKeNyT.v8gPOPe', '1', 'cashier', NULL, true, 'f375aece-ad44-4ff3-a998-4dbb88869caf', '2026-03-09 01:28:14.868', '2026-03-14 23:16:32.393', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb', 'b65967e3-e9e3-4572-aaa5-89173cc4032f', NULL);
INSERT INTO public.users VALUES (3, '2', '$2b$10$YmczihCsqvF4T19Z9v6H3uv6Ri0z.y1DFDn2wYlf3xjkJydAmv2rm', '2', 'cashier', NULL, true, NULL, '2026-03-09 01:28:48.051', '2026-03-15 14:26:51.703', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537', '6a1258e0-482b-4f1d-8779-c0ef51c99560', NULL);


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: bank_transactions; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.customers VALUES (1, 'شركة المنار الثنائية التجارية', '0555547117', NULL, 'عبدالله حاصر', '99665', 'حي الزهراء', 'جدة', '23521', 1, 0, 100000, '311354840700003', NULL, true, '2026-03-12 18:56:41.496');


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.categories VALUES (1, 'زيوت', 0, NULL);


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: coupon_usage; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: fixed_assets; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: depreciations; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.expenses VALUES (2, '2026-03-10 23:03:33.463', NULL, 'حسين', 2000, NULL, NULL, NULL);
INSERT INTO public.expenses VALUES (3, '2026-03-11 13:44:16.241', NULL, 'إيجار ناصر', 1000, NULL, NULL, NULL);
INSERT INTO public.expenses VALUES (4, '2026-03-11 18:29:16.394', NULL, 'تسجيل ات  ابراهي', 6000, NULL, NULL, NULL);


--
-- Data for Name: gift_cards; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: installments; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: installment_payments; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: journal_lines; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: loyalty_points; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: loyalty_transactions; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: maintenance; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.units VALUES (1, 'حبة');
INSERT INTO public.units VALUES (2, 'كرتون');
INSERT INTO public.units VALUES (3, 'كيلو');
INSERT INTO public.units VALUES (4, 'جرام');
INSERT INTO public.units VALUES (5, 'لتر');
INSERT INTO public.units VALUES (6, 'متر');
INSERT INTO public.units VALUES (7, 'علبة');
INSERT INTO public.units VALUES (8, 'كيس');
INSERT INTO public.units VALUES (9, 'طن');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.products VALUES (51, 'زيت اوتو ميركا 0-20', NULL, 1, 1, 14.7826087, 30.0000000095, 15, 0, 2, NULL, true, '2026-03-11 21:06:02.617', '', '', '', '', '', false);
INSERT INTO public.products VALUES (11, 'زيت شل هيلكس 5-40', NULL, 1, 1, 23.1884058, 40.000000005, 15, 0, 12, NULL, true, '2026-03-11 19:50:24.65', '', '', '', '', '', false);
INSERT INTO public.products VALUES (12, 'زيت شل هيلكس 10-40', NULL, 1, 1, 17.394, 34.999720999999994, 15, 0, 0, NULL, true, '2026-03-11 19:51:00.008', '', '', '', '', '', false);
INSERT INTO public.products VALUES (15, 'زيت شل روميلا 15-40 جالون 4 لتر', NULL, 1, 1, 45.65217392, 80.00000001, 15, 0, 30, NULL, true, '2026-03-11 19:57:31.177', '', '', '', '', '', false);
INSERT INTO public.products VALUES (16, 'زيت شل رويلا 20-50 جالون 4 لتر ', NULL, 1, 1, 45.65217392, 80.00000001, 15, 0, 1, NULL, true, '2026-03-11 19:58:50.781', '', '', '', '', '', false);
INSERT INTO public.products VALUES (18, 'زيت شل هيلكس 15-40 لتر 1', NULL, 1, 1, 15.217391431, 23, 15, 0, 39, NULL, true, '2026-03-11 20:00:36.435', '', '', '', '', '', false);
INSERT INTO public.products VALUES (19, 'تماتيك دمكس CVX', NULL, 1, 1, 23.47826087, 100.00000007, 15, 0, 8, NULL, true, '2026-03-11 20:06:30.921', '', '', '', '', '', false);
INSERT INTO public.products VALUES (20, 'معالج جير ديمكس', NULL, 1, 1, 14.7826087, 70.000000003, 15, 0, 2, NULL, true, '2026-03-11 20:07:17.638', '', '', '', '', '', false);
INSERT INTO public.products VALUES (21, 'معالج دركسون ديمكس', NULL, 1, 1, 12.17391305, 70.000000003, 15, 0, 23, NULL, true, '2026-03-11 20:10:03.321', '', '', '', '', '', false);
INSERT INTO public.products VALUES (22, 'غسيل مكينه ديمكس', NULL, 1, 1, 11.30434783, 70.000000003, 15, 0, 14, NULL, true, '2026-03-11 20:11:27.065', '', '', '', '', '', false);
INSERT INTO public.products VALUES (24, 'زيت توتال 20-50', NULL, 1, 1, 11.5942029, 23, 15, 0, 16, NULL, true, '2026-03-11 20:14:23.284', '', '', '', '', '', false);
INSERT INTO public.products VALUES (25, 'زيت توتال 10-30', NULL, 1, 1, 11.5942029, 23, 15, 0, 7, NULL, true, '2026-03-11 20:15:15.326', '', '', '', '', '', false);
INSERT INTO public.products VALUES (26, 'زيت توتال 5-30', NULL, 1, 1, 21.73913044, 35.0000000015, 15, 0, 2, NULL, true, '2026-03-11 20:16:28.278', '', '', '', '', '', false);
INSERT INTO public.products VALUES (17, 'زيت شل تماتيك ', NULL, 1, 1, 20, 46, 15, 0, 34, NULL, true, '2026-03-11 19:59:50.836', '', '', '', '', '', false);
INSERT INTO public.products VALUES (28, 'ستب معالج حماية المكينة مبكو', NULL, 1, 1, 11.30434783, 70.000000003, 15, 0, 15, NULL, true, '2026-03-11 20:21:01.534', '', '', '', '', '', false);
INSERT INTO public.products VALUES (29, 'معالج منظف نظام الوقود مبكو', NULL, 1, 1, 11.30434783, 70.000000003, 15, 0, 6, NULL, true, '2026-03-11 20:23:16.24', '', '', '', '', '', false);
INSERT INTO public.products VALUES (30, 'معالج مانع تسريب الوقود', NULL, 1, 1, 11.30434783, 70.000000003, 15, 0, 15, NULL, true, '2026-03-11 20:24:18.698', '', '', '', '', '', false);
INSERT INTO public.products VALUES (32, 'ماء رديتر اخضر مبكو 1 لتر', NULL, 1, 1, 13.0435, 25.003921000000002, 15, 0, 2, NULL, true, '2026-03-11 20:40:05.788', '', '', '', '', '', false);
INSERT INTO public.products VALUES (34, 'زيت موتر كرافت 5-20', NULL, 1, 1, 13.04345, 25.003925714999998, 15, 0, 4, NULL, true, '2026-03-11 20:41:58.05', '', '', '', '', '', false);
INSERT INTO public.products VALUES (35, 'زيت موتر كرافت', NULL, 1, 1, 13.043451, 25.003937559999997, 15, 0, 11, NULL, true, '2026-03-11 20:42:32.54', '', '', '', '', '', false);
INSERT INTO public.products VALUES (36, 'زيت موبيل 5-30', NULL, 1, 1, 23.1884058, 45.0000000085, 15, 0, 2, NULL, true, '2026-03-11 20:43:33.896', '', '', '', '', '', false);
INSERT INTO public.products VALUES (38, 'دركسون 1 لتر احمر', NULL, 1, 1, 5.072463768, 10.004999999999999, 15, 0, 58, NULL, true, '2026-03-11 20:45:22.113', '', '', '', '', '', false);
INSERT INTO public.products VALUES (39, 'درسون نص لتر', NULL, 1, 1, 2.536231884, 5.0024999999999995, 15, 0, 203, NULL, true, '2026-03-11 20:46:13.414', '', '', '', '', '', false);
INSERT INTO public.products VALUES (42, 'كاء مقطر', NULL, 1, 1, 1.449275362, 5.0024999999999995, 15, 0, 254, NULL, true, '2026-03-11 20:48:28.835', '', '', '', '', '', false);
INSERT INTO public.products VALUES (43, 'شحم بالبيد 1 لتر', NULL, 1, 1, 10, 24.65071, 15, 0, 12, NULL, true, '2026-03-11 20:48:59.064', '', '', '', '', '', false);
INSERT INTO public.products VALUES (52, 'زيت اوتو ميركا 5-20', NULL, 1, 1, 11.30434783, 25.00722403, 15, 0, 4, NULL, true, '2026-03-11 21:06:54.591', '', '', '', '', '', false);
INSERT INTO public.products VALUES (55, 'زيت بترومين 20-50', NULL, 1, 1, 13.91304348, 23, 15, 0, 17, NULL, true, '2026-03-11 21:10:33.918', '', '', '', '', '', false);
INSERT INTO public.products VALUES (57, 'زيت بترومين 5-30', NULL, 1, 1, 21.74, 45.0000000085, 15, 0, 33, NULL, true, '2026-03-11 21:11:49.01', '', '', '', '', '', false);
INSERT INTO public.products VALUES (58, 'زيت بترومين 0-20', NULL, 1, 1, 21.74, 45.0000000085, 15, 0, 3, NULL, true, '2026-03-11 21:12:14.303', '', '', '', '', '', false);
INSERT INTO public.products VALUES (59, 'زيت بترومين 15-40 ديزل 1 لتر', NULL, 1, 1, 8.7, 20.009999999999998, 15, 0, 19, NULL, true, '2026-03-11 21:12:42.263', '', '', '', '', '', false);
INSERT INTO public.products VALUES (60, 'زيت بترومين 15-40 جالون 4 لتر', NULL, 1, 1, 43.47826087, 80.00000001, 15, 0, 41, NULL, true, '2026-03-11 21:13:45.256', '', '', '', '', '', false);
INSERT INTO public.products VALUES (61, 'زيت بترومينATF', NULL, 1, 1, 20, 50.000000000499995, 15, 0, 34, NULL, true, '2026-03-11 21:15:12.154', '', '', '', '', '', false);
INSERT INTO public.products VALUES (40, 'زيت فرامل 21 ', NULL, 1, 1, 5.797101449, 10.005, 15, 0, 83, NULL, true, '2026-03-11 20:46:49.375', '', '', '', '', '', false);
INSERT INTO public.products VALUES (13, 'زيت شل هيلكس 10-30', NULL, 1, 1, 14.49275362, 24.9999995, 15, 0, 265, NULL, true, '2026-03-11 19:53:40.774', '', '', '', '', '', false);
INSERT INTO public.products VALUES (31, 'معالج منظف دبة البيئة مبكو', NULL, 1, 1, 11.30434783, 60.0000000075, 15, 0, 9, NULL, true, '2026-03-11 20:38:56.293', '', '', '', '', '', false);
INSERT INTO public.products VALUES (14, 'زيت شل هيلكس 20-50', NULL, 1, 1, 10.86956522, 23, 15, 0, 28, NULL, true, '2026-03-11 19:54:38.431', '', '', '', '', '', false);
INSERT INTO public.products VALUES (10, 'زيت شل هيلكس 5-30', NULL, 1, 1, 23.1884058, 39.9999921505, 15, 0, 83, NULL, true, '2026-03-11 19:49:17.272', '', '', '', '', '', false);
INSERT INTO public.products VALUES (53, 'زيت اوتو ميركا جير CVT', NULL, 1, 1, 17.4, 60.0000000075, 15, 0, 52, NULL, true, '2026-03-11 21:08:27.729', '', '', '', '', '', false);
INSERT INTO public.products VALUES (27, 'معالج منظف الصمام مبكو', NULL, 1, 1, 9.5652174, 60.0000000075, 15, 0, 10, NULL, true, '2026-03-11 20:18:58.505', '', '', '', '', '', false);
INSERT INTO public.products VALUES (6, 'زيت تويوتا 15-40 ديزل جالون 4 لتر', NULL, 1, 1, 46.03768116, 75.00000000649999, 13, 0, 17, NULL, true, '2026-03-11 19:44:21.227', '', '', '', '', '', false);
INSERT INTO public.products VALUES (54, 'زيت اوتو ميركا تماتيك ATF', NULL, 1, 1, 9.5652174, 30.0000000095, 15, 0, 87, NULL, true, '2026-03-11 21:09:37.398', '', '', '', '', '', false);
INSERT INTO public.products VALUES (103, 'زيت كراون 5-30', NULL, 1, 1, 13, 45, 15, 0, 36, NULL, true, '2026-03-12 17:53:20.13', '', '', '', '', '', false);
INSERT INTO public.products VALUES (45, 'ماء لديتر احمر', NULL, 1, 1, 3.260869566, 10.005, 15, 0, 27, NULL, true, '2026-03-11 20:50:12.536', '', '', '', '', '', false);
INSERT INTO public.products VALUES (23, 'معالج سرميك ديمكس', NULL, 1, 1, 34.7826087, 100.00000007, 15, 0, 10, NULL, true, '2026-03-11 20:12:15.602', '', '', '', '', '', false);
INSERT INTO public.products VALUES (47, 'زيت اوتو ميركا 10-30', NULL, 1, 1, 8.7, 14.9999675, 15, 0, 152, NULL, true, '2026-03-11 20:56:22.692', '', '', '', '', '', false);
INSERT INTO public.products VALUES (50, 'زيت اوتو ميركا 10-40', NULL, NULL, 1, 11.30434783, 25.00499625, 15, 0, 2, NULL, true, '2026-03-11 21:04:46.238', '', '', '', '', '', false);
INSERT INTO public.products VALUES (48, 'زيت اوتو ميركا 5-30', NULL, 1, 1, 13.04354, 25.003921, 15, 0, 46, NULL, true, '2026-03-11 20:57:00.501', '', '', '', '', '', false);
INSERT INTO public.products VALUES (41, 'زيت فرامل بلاستك', NULL, 1, 1, 1.449275362, 5.0025, 15, 0, 146, NULL, true, '2026-03-11 20:47:23.471', '', '', '', '', '', false);
INSERT INTO public.products VALUES (37, 'دركسون لتر 1 ', NULL, 1, 1, 5.072463768, 14.99996865, 15, 0, 59, NULL, true, '2026-03-11 20:44:39.481', '', '', '', '', '', false);
INSERT INTO public.products VALUES (49, 'زيت اوتو ميركا 5-40', NULL, 1, 1, 13.04345, 35.0000000015, 15, 0, 0, NULL, true, '2026-03-11 21:02:55.497', '', '', '', '', '', false);
INSERT INTO public.products VALUES (46, ' زيت اوتو ميركا 20-50', NULL, 1, 1, 8.7, 14.9999675, 15, 0, 318, NULL, true, '2026-03-11 20:55:16.215', '', '', '', '', '', false);
INSERT INTO public.products VALUES (2, 'زيت تويوتا 15-40 بنزين', NULL, 1, 1, 15.21739, 24.9999995, 15, 0, 44, NULL, true, '2026-03-11 19:39:28.425', '', '', '', '', '', false);
INSERT INTO public.products VALUES (33, 'زيت موبار 5-20', NULL, 1, 1, 8.7, 25.00392721, 15, 0, 29, NULL, true, '2026-03-11 20:41:17.974', '', '', '', '', '', false);
INSERT INTO public.products VALUES (84, 'زيت بترو سناد 10-30', NULL, 1, 1, 8.7, 20.0038475, 15, 0, 45, NULL, true, '2026-03-11 21:45:20.632', '', '', '', '', '', false);
INSERT INTO public.products VALUES (4, 'زيت تويوتا 5-40', NULL, 1, 1, 28.26086957, 45.0000000085, 15, 0, 35, NULL, true, '2026-03-11 19:41:42.566', '', '', '', '', '', false);
INSERT INTO public.products VALUES (7, 'زيت تويوتا 0-20', NULL, 1, 1, 30.43478261, 45.0000000085, 15, 0, 36, NULL, true, '2026-03-11 19:45:25.404', '', '', '', '', '', false);
INSERT INTO public.products VALUES (5, 'زيت تويوتا 5-30', NULL, 1, 1, 29.71014493, 43.000000002499995, 15, 0, 65, NULL, true, '2026-03-11 19:42:58.679', '', '', '', '', '', false);
INSERT INTO public.products VALUES (8, 'زيت لكزز 5-30', NULL, 1, 1, 30.434782561, 0, 15, 0, 57, NULL, true, '2026-03-11 19:47:16.515', '', '', '', '', '', false);
INSERT INTO public.products VALUES (9, 'زيت سوبر شل', NULL, 1, 1, 13.76811594, 23, 15, 0, 43, NULL, true, '2026-03-11 19:48:28.937', '', '', '', '', '', false);
INSERT INTO public.products VALUES (1, 'زيت تويوتا حديد 20-50', NULL, 1, 1, 13.0434354, 23, 15, 0, 456, NULL, true, '2026-03-11 19:30:31.491', '', '', '', '', '', false);
INSERT INTO public.products VALUES (64, 'زيت فوكس 5-30', NULL, 1, 1, 21.73913044, 45.0000000085, 15, 0, 32, NULL, true, '2026-03-11 21:17:35.403', '', '', '', '', '', false);
INSERT INTO public.products VALUES (79, 'زيت سما  20-50 ديزل 1 لتر', NULL, 1, 1, 8.7, 23, 15, 0, 12, NULL, true, '2026-03-11 21:40:42.658', '', '', '', '', '', false);
INSERT INTO public.products VALUES (80, 'زيت سما  ديزل 15-40 جالون 4 لتر', NULL, 1, 1, 26.08695653, 100.05, 15, 0, 13, NULL, true, '2026-03-11 21:41:39.627', '', '', '', '', '', false);
INSERT INTO public.products VALUES (81, 'زيت سما  ديزل 20-50 جالون 4 لتر ', NULL, 1, 1, 26.08695653, 100.05, 15, 0, 1, NULL, true, '2026-03-11 21:42:59.949', '', '', '', '', '', false);
INSERT INTO public.products VALUES (82, 'زيت سما  تماتيك ATF', NULL, 1, 1, 8.7, 30.000000009499995, 15, 0, 13, NULL, true, '2026-03-11 21:43:46.07', '', '', '', '', '', false);
INSERT INTO public.products VALUES (86, 'زيت بترو سناد 15-40 لتر 1', NULL, 1, 1, 8.7, 20.00349675, 15, 0, 40, NULL, true, '2026-03-11 21:47:36.721', '', '', '', '', '', false);
INSERT INTO public.products VALUES (88, 'زيت بترو سناد تروس 140', NULL, 1, 1, 26.08695653, 100.05, 15, 0, 5, NULL, true, '2026-03-11 21:50:52.669', '', '', '', '', '', false);
INSERT INTO public.products VALUES (89, 'زيت بترو سناد تروس 90', NULL, 1, 1, 26.0895653, 100.05, 15, 0, 8, NULL, true, '2026-03-11 21:51:24.328', '', '', '', '', '', false);
INSERT INTO public.products VALUES (90, 'زيت كاسترول 0-20', NULL, 1, 1, 28.69565218, 54.999999992499994, 15, 0, 24, NULL, true, '2026-03-11 22:05:02.592', '', '', '', '', '', false);
INSERT INTO public.products VALUES (91, 'زيت كاسترول 5-30', NULL, 1, 1, 20.28985507, 45.0000000085, 15, 0, 61, NULL, true, '2026-03-11 22:05:49.579', '', '', '', '', '', false);
INSERT INTO public.products VALUES (95, 'زيت كاسترول ديزل 15-40 جالون 4 لتر ', NULL, 1, 1, 43.47826087, 80.00000001, 15, 0, 12, NULL, true, '2026-03-11 22:09:07.124', '', '', '', '', '', false);
INSERT INTO public.products VALUES (96, 'زيت كاسترول تروس 140', NULL, 1, 1, 34.7826087, 100.05, 15, 0, 2, NULL, true, '2026-03-11 22:09:29.034', '', '', '', '', '', false);
INSERT INTO public.products VALUES (98, 'زيت كاسترول تماتيك ', NULL, 1, 1, 17.4, 60.000032149999996, 15, 0, 2, NULL, true, '2026-03-11 22:10:25.017', '', '', '', '', '', false);
INSERT INTO public.products VALUES (102, 'زيت كيكس تماتيك', NULL, 1, 1, 13.4354, 25.0401, 15, 0, 1, NULL, true, '2026-03-11 22:13:02.699', '', '', '', '', '', false);
INSERT INTO public.products VALUES (62, 'زيت فوكس 20-50', NULL, 1, 1, 13.04345, 23, 15, 0, 99, NULL, true, '2026-03-11 21:15:48.49', '', '', '', '', '', false);
INSERT INTO public.products VALUES (85, 'زيت بترو سناد 5-30', NULL, 1, 1, 13.43451, 35.0000000015, 15, 0, 14, NULL, true, '2026-03-11 21:47:04.499', '', '', '', '', '', false);
INSERT INTO public.products VALUES (92, 'زيت كاسترول 10-40', NULL, 1, 1, 17.4, 35.0000000015, 15, 0, 23, NULL, true, '2026-03-11 22:06:47.201', '', '', '', '', '', false);
INSERT INTO public.products VALUES (3, 'زيت تويوتا 10-40', NULL, 1, 1, 21.014493756, 35.0000000015, 15, 0, 63, NULL, true, '2026-03-11 19:40:27.502', '', '', '', '', '', false);
INSERT INTO public.products VALUES (99, ' سوبر جي تي اقاسيم بلاستك ', NULL, 1, 1, 4.35, 100.05, 15, 0, 478, NULL, true, '2026-03-11 22:11:09.098', '', '', '', '', '', false);
INSERT INTO public.products VALUES (93, 'زيت كاسترول 20-50', NULL, 1, 1, 13.76811594, 23, 15, 0, 127, NULL, true, '2026-03-11 22:07:27.149', '', '', '', '', '', false);
INSERT INTO public.products VALUES (97, 'زيت كاسترول تروس 90', NULL, 1, 1, 34.78256087, 100.05, 15, 0, 11, NULL, true, '2026-03-11 22:09:49.976', '', '', '', '', '', false);
INSERT INTO public.products VALUES (104, 'زيت كاسترول 15-40 واحد لتر', NULL, NULL, 1, 15, 25, 15, 0, 1, NULL, true, '2026-03-12 17:59:10.01', '', '', '', '', '', false);
INSERT INTO public.products VALUES (83, 'زيت بترو سناد 20-50', NULL, 1, 1, 8.7, 23, 15, 0, 135, NULL, true, '2026-03-11 21:44:16.808', '', '', '', '', '', false);
INSERT INTO public.products VALUES (94, 'زيت كاسترول 10-30', NULL, 1, 1, 13.768115947, 23, 15, 0, 133, NULL, true, '2026-03-11 22:07:48.394', '', '', '', '', '', false);
INSERT INTO public.products VALUES (56, 'زيت بترومين 10-30', NULL, 1, 1, 13.91304348, 23, 15, 0, 1, NULL, true, '2026-03-11 21:11:01.509', '', '', '', '', '', false);
INSERT INTO public.products VALUES (87, 'زيت بترو سناد ديزل 15-40  جالون 4 لتر ', NULL, 1, 1, 26.08695653, 80.02450000099999, 15, 0, 34, NULL, true, '2026-03-11 21:49:16.688', '', '', '', '', '', false);
INSERT INTO public.products VALUES (63, 'زيت فوكس 10-30', NULL, 1, 1, 11.95652174, 23, 15, 0, 143, NULL, true, '2026-03-11 21:16:23.551', '', '', '', '', '', false);
INSERT INTO public.products VALUES (105, 'دركسون  صغير', NULL, NULL, 1, 2, 5, 15, 0, 203, NULL, true, '2026-03-12 18:07:51.783', '', '', '', '', '', false);
INSERT INTO public.products VALUES (106, 'ماء مقطر ', NULL, NULL, 1, 2, 5, 15, 0, 254, NULL, true, '2026-03-12 18:08:45.706', '', '', '', '', '', false);
INSERT INTO public.products VALUES (44, 'ماء لديتر اخضر', NULL, 1, 1, 3.260869566, 10.005, 15, 0, 27, NULL, true, '2026-03-11 20:49:46.431', '', '', '', '', '', false);
INSERT INTO public.products VALUES (77, 'زيت سما  10-30', NULL, 1, 1, 8.7, 20.003721, 15, 0, 112, NULL, true, '2026-03-11 21:38:39.228', '', '', '', '', '', false);
INSERT INTO public.products VALUES (70, 'زيت فوكس 5-30', NULL, 1, 1, 11.30434783, 35.0000000015, 15, 0, 27, NULL, true, '2026-03-11 21:31:04.439', '', '', '', '', '', false);
INSERT INTO public.products VALUES (107, 'زيت اوتو ميركا 0-40', NULL, 1, 1, 14.45, 40, 15, 0, 12, NULL, true, '2026-03-12 21:34:11.149', '', '', '', '', '', false);
INSERT INTO public.products VALUES (71, 'زيت كراون 10-30', NULL, 1, 1, 8.7, 23, 15, 0, 26, NULL, true, '2026-03-11 21:31:59.442', '', '', '', '', '', false);
INSERT INTO public.products VALUES (78, 'زيت سما  20-50', NULL, 1, 1, 8.7, 20.00708981, 15, 0, 116, NULL, true, '2026-03-11 21:39:06.267', '', '', '', '', '', false);
INSERT INTO public.products VALUES (100, 'سوبر جي تي اقاسيم حديد', NULL, 1, 1, 4.35, 10.005, 15, 0, 140, NULL, true, '2026-03-11 22:11:40.567', '', '', '', '', '', false);
INSERT INTO public.products VALUES (72, 'زيت كراون 20-50', NULL, 1, 1, 8.7, 23, 15, 0, 24, NULL, true, '2026-03-11 21:32:46.993', '', '', '', '', '', false);
INSERT INTO public.products VALUES (65, 'زيت فوكس 15-40 لتر 1', NULL, 1, 1, 13.04345, 25.000999999999998, 15, 0, 5, NULL, true, '2026-03-11 21:18:05.058', '', '', '', '', '', false);
INSERT INTO public.products VALUES (66, 'زيت فوكس 15-40 ديزل جالون 4 لتر', NULL, 1, 1, 40.579741014, 80.00000001, 15, 0, 49, NULL, true, '2026-03-11 21:19:18.028', '', '', '', '', '', false);
INSERT INTO public.products VALUES (101, 'زيت سي ديلكو 0-20', NULL, 1, 1, 28.98550725, 55.00000000399999, 15, 0, 22, NULL, true, '2026-03-11 22:12:16.073', '', '', '', '', '', false);
INSERT INTO public.products VALUES (68, 'زيت فوكس غسيل مكينه', NULL, 1, 1, 34.7826087, 80.00000001, 15, 0, 12, NULL, true, '2026-03-11 21:23:10.973', '', '', '', '', '', false);
INSERT INTO public.products VALUES (69, 'زيت فوكس تروس 90', NULL, 1, 1, 40.57971014, 100.05, 15, 0, 2, NULL, true, '2026-03-11 21:23:59.233', '', '', '', '', '', false);
INSERT INTO public.products VALUES (67, 'زيت فوكس 0-20', NULL, 1, 1, 21.74, 45.0000000085, 15, 0, 12, NULL, true, '2026-03-11 21:19:47.569', '', '', '', '', '', false);
INSERT INTO public.products VALUES (73, 'زيت كراون هدرليك ', NULL, 1, 1, 26.08695653, 80.00000001, 15, 0, 24, NULL, true, '2026-03-11 21:35:24.557', '', '', '', '', '', false);
INSERT INTO public.products VALUES (74, 'زيت كراون تروس 140', NULL, 1, 1, 26.08695653, 100.05, 15, 0, 24, NULL, true, '2026-03-11 21:36:11.13', '', '', '', '', '', false);
INSERT INTO public.products VALUES (75, 'زيت كراون تروس 90', NULL, 1, 1, 26.08695653, 100.05, 15, 0, 31, NULL, true, '2026-03-11 21:37:02.508', '', '', '', '', '', false);
INSERT INTO public.products VALUES (76, 'زيت سما  5-30', NULL, 1, 1, 13.04345, 35.0000000015, 15, 0, 1, NULL, true, '2026-03-11 21:38:07.673', '', '', '', '', '', false);


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: manufacturing_orders; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: price_quotes; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.price_quotes VALUES (1, 1, '2026-03-15 08:25:29.167', NULL, 40, 'pending', NULL, NULL);


--
-- Data for Name: price_quote_details; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.price_quote_details VALUES (1, 1, 107, 'زيت اوتو ميركا 0-40', 1, 40, 40);


--
-- Data for Name: product_batches; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: stocks; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.stocks VALUES (1, 'المستودع الرئيسي', '', true, NULL);


--
-- Data for Name: purchase_invoices; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: purchase_invoice_details; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: purchase_returns; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: salaries; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: sales_invoices; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: sales_invoice_details; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: sales_returns; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.settings VALUES (5, 'currency', 'ريال', 'العملة');
INSERT INTO public.settings VALUES (6, 'tax_rate', '15', 'نسبة الضريبة');
INSERT INTO public.settings VALUES (7, 'zatca_enabled', '1', 'تفعيل ZATCA');
INSERT INTO public.settings VALUES (8, 'receipt_header', 'بسم الله الرحمن الرحيم', 'رأس الفاتورة');
INSERT INTO public.settings VALUES (9, 'receipt_footer', 'شكراً لتعاملكم معنا', 'تذييل الفاتورة');
INSERT INTO public.settings VALUES (10, 'printer_name', '', 'اسم الطابعة');
INSERT INTO public.settings VALUES (11, 'whatsapp_token', '', 'WhatsApp Token');
INSERT INTO public.settings VALUES (12, 'whatsapp_phone_id', '', 'WhatsApp Phone ID');
INSERT INTO public.settings VALUES (2, 'company_phone', '0540406379', 'هاتف الشركة');
INSERT INTO public.settings VALUES (17, 'zatca_industry', 'Technology', NULL);
INSERT INTO public.settings VALUES (3, 'company_address', 'نجران', 'عنوان الشركة');
INSERT INTO public.settings VALUES (19, 'zatca_crn', '7016739265', NULL);
INSERT INTO public.settings VALUES (20, 'zatca_street', 'شارع الملك  عبدالعزيز', NULL);
INSERT INTO public.settings VALUES (22, 'zatca_district', 'الخالدية', NULL);
INSERT INTO public.settings VALUES (23, 'zatca_building', '8809', NULL);
INSERT INTO public.settings VALUES (24, 'zatca_city', 'نجران', NULL);
INSERT INTO public.settings VALUES (28, 'zatca_private_key', '', 'ZATCA Private Key (auto)');
INSERT INTO public.settings VALUES (29, 'zatca_certificate', '', 'ZATCA CSR PEM (auto)');
INSERT INTO public.settings VALUES (21, 'zatca_city_en', 'najran', NULL);
INSERT INTO public.settings VALUES (15, 'company_name_en', 'Spider Company ', NULL);
INSERT INTO public.settings VALUES (1, 'company_name', 'شركة العنكبوت ', 'اسم الشركة');
INSERT INTO public.settings VALUES (25, 'zatca_postal_code', '855855', NULL);
INSERT INTO public.settings VALUES (4, 'tax_number', '311330902500003', 'الرقم الضريبي');
INSERT INTO public.settings VALUES (26, 'zatca_environment', 'production', NULL);
INSERT INTO public.settings VALUES (27, 'zatca_otp', '220220', NULL);
INSERT INTO public.settings VALUES (66, 'printer_type', 'A4', NULL);


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: stock_transfers; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: stock_transfer_details; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: stocktakes; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: stocktake_items; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: treasury; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.treasury VALUES (2, '2026-03-10 23:03:33.468', 'out', 2000, 'مصروف: حسين (تلجرام)', 'expense', NULL, NULL, NULL);
INSERT INTO public.treasury VALUES (3, '2026-03-11 13:44:16.245', 'out', 1000, 'مصروف: إيجار ناصر (تلجرام)', 'expense', NULL, NULL, NULL);
INSERT INTO public.treasury VALUES (4, '2026-03-11 18:29:16.398', 'out', 6000, 'مصروف: تسجيل ات  ابراهي (تلجرام)', 'expense', NULL, NULL, NULL);


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.user_permissions VALUES (215, 1, 'price-quotes', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (216, 2, 'price-quotes', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (217, 3, 'price-quotes', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (99, 3, 'dashboard', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (100, 3, 'sales', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (101, 3, 'purchases', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (102, 3, 'sales-returns', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (103, 3, 'purchase-returns', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (104, 3, 'products', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (105, 3, 'stock', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (106, 3, 'customers', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (107, 3, 'treasury', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (108, 3, 'expenses', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (109, 3, 'reports', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (110, 3, 'employees', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (111, 3, 'bookings', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (112, 3, 'promotions', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (113, 3, 'accounting', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (129, 1, 'dashboard', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (130, 1, 'sales', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (131, 1, 'purchases', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (132, 1, 'sales-returns', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (133, 1, 'purchase-returns', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (134, 1, 'products', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (135, 1, 'stock', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (136, 1, 'customers', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (137, 1, 'treasury', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (138, 1, 'expenses', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (139, 1, 'reports', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (140, 1, 'employees', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (141, 1, 'settings', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (142, 1, 'bookings', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (143, 1, 'promotions', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (144, 1, 'accounting', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (145, 1, 'manage_users', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (146, 1, 'manage_permissions', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (147, 1, 'delete_invoices', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (148, 1, 'delete_expense', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (149, 1, 'delete_all_expenses', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (150, 1, 'edit_expense', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (151, 1, 'delete_products', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (152, 1, 'reset_stock', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (153, 1, 'delete_all_sales', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (154, 1, 'reset_password', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (155, 1, 'clear_zatca', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (200, 2, 'dashboard', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (201, 2, 'sales', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (202, 2, 'purchases', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (203, 2, 'sales-returns', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (204, 2, 'purchase-returns', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (205, 2, 'products', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (206, 2, 'stock', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (207, 2, 'customers', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (208, 2, 'treasury', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (209, 2, 'expenses', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (210, 2, 'reports', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (211, 2, 'employees', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (212, 2, 'bookings', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (213, 2, 'promotions', true, true, true, true, true);
INSERT INTO public.user_permissions VALUES (214, 2, 'accounting', true, true, true, true, true);


--
-- Data for Name: vacations; Type: TABLE DATA; Schema: public; Owner: namasoft
--



--
-- Data for Name: zatca_settings; Type: TABLE DATA; Schema: public; Owner: namasoft
--

INSERT INTO public.zatca_settings VALUES (1, 'شركة العنكبوت ', 'شركة العنكبوت ', 'Spider Company ', '311330902500003', '7016739265', 'شارع الملك  عبدالعزيز', 'الخالدية', 'نجران', 'najran', '855855', '8809', 'SA', 'simplified', 2, 'production', '0540406379', '', '7016739265', 'Spider Company ', 'شركة العنكبوت ', 'Technology', '1100', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-15 15:48:58.336851', '2026-03-15 08:23:58.406064');


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.accounts_id_seq', 17, true);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 1, false);


--
-- Name: bank_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.bank_accounts_id_seq', 1, false);


--
-- Name: bank_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.bank_transactions_id_seq', 1, false);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.bookings_id_seq', 1, false);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.branches_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.companies_id_seq', 1, false);


--
-- Name: coupon_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.coupon_usage_id_seq', 1, false);


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.coupons_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, true);


--
-- Name: depreciations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.depreciations_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.employees_id_seq', 1, false);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.expenses_id_seq', 4, true);


--
-- Name: fixed_assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.fixed_assets_id_seq', 1, false);


--
-- Name: gift_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.gift_cards_id_seq', 1, false);


--
-- Name: installment_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.installment_payments_id_seq', 1, false);


--
-- Name: installments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.installments_id_seq', 1, false);


--
-- Name: journal_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.journal_entries_id_seq', 1, false);


--
-- Name: journal_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.journal_lines_id_seq', 1, false);


--
-- Name: loyalty_points_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.loyalty_points_id_seq', 1, false);


--
-- Name: loyalty_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.loyalty_transactions_id_seq', 1, false);


--
-- Name: maintenance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.maintenance_id_seq', 1, false);


--
-- Name: manufacturing_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.manufacturing_orders_id_seq', 1, false);


--
-- Name: price_quote_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.price_quote_details_id_seq', 1, true);


--
-- Name: price_quotes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.price_quotes_id_seq', 1, true);


--
-- Name: product_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.product_batches_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.products_id_seq', 107, true);


--
-- Name: promotions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.promotions_id_seq', 1, false);


--
-- Name: purchase_invoice_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.purchase_invoice_details_id_seq', 1, true);


--
-- Name: purchase_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.purchase_invoices_id_seq', 1, true);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 1, false);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, false);


--
-- Name: purchase_returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.purchase_returns_id_seq', 1, false);


--
-- Name: quotation_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.quotation_items_id_seq', 1, false);


--
-- Name: quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.quotations_id_seq', 1, false);


--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.recipe_ingredients_id_seq', 1, false);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.recipes_id_seq', 1, false);


--
-- Name: salaries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.salaries_id_seq', 1, false);


--
-- Name: sales_invoice_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.sales_invoice_details_id_seq', 1, false);


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.sales_invoices_id_seq', 1, false);


--
-- Name: sales_returns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.sales_returns_id_seq', 1, false);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.settings_id_seq', 66, true);


--
-- Name: shifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.shifts_id_seq', 1, false);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 1, false);


--
-- Name: stock_transfer_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.stock_transfer_details_id_seq', 1, false);


--
-- Name: stock_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.stock_transfers_id_seq', 1, false);


--
-- Name: stocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.stocks_id_seq', 1, true);


--
-- Name: stocktake_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.stocktake_items_id_seq', 1, false);


--
-- Name: stocktakes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.stocktakes_id_seq', 1, false);


--
-- Name: treasury_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.treasury_id_seq', 4, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.units_id_seq', 9, true);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 217, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: vacations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.vacations_id_seq', 1, false);


--
-- Name: zatca_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: namasoft
--

SELECT pg_catalog.setval('public.zatca_settings_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict bfJALwbhUw50FjzIAuTo9U2QwBtmF5ECuMmKcgJgDjlAIIJ6VRhbiKPCUcPuRuL

