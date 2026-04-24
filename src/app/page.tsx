"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import {
  ShieldCheck, Bot, MessageCircle, ShoppingCart,
  Building, Wallet, Users, Fingerprint, Database, Factory,
  Cpu, TrendingUp, Truck, Wrench, Home, Layers, Phone,
  Calculator, CreditCard, FileText, Clock, Archive,
  Package, BellRing, Barcode, Hash, CheckSquare, Camera,
  UserCheck, Award, Megaphone, Gift, Link as LinkIcon, Star, BookOpen,
  Eye, GitMerge, Map, Target, Settings, Inbox, RefreshCcw,
  CalendarDays, DollarSign, Activity, Network, BarChart3,
  FileEdit, Receipt, Sliders, FileCheck, History, Repeat,
  CheckCircle, LineChart, Briefcase, Globe, ClipboardList,
  LayoutDashboard, BarChart2, Hourglass,
  Pill, ShoppingBag, UtensilsCrossed, Cog, Brain,
  ChevronDown, ChevronUp, ArrowLeft, Menu, X, Search, Download, Monitor
} from "lucide-react";

// â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORIES = [
  { id: 'all', label: 'ط§ظ„ظƒظ„', emoji: 'ًںŒگ' },
  { id: 'finance', label: 'ط§ظ„ظ…ط§ظ„ظٹط©', emoji: 'ًں’°' },
  { id: 'sales', label: 'ط§ظ„ظ…ط¨ظٹط¹ط§طھ', emoji: 'ًں›’' },
  { id: 'purchases', label: 'ط§ظ„ظ…ط´طھط±ظٹط§طھ', emoji: 'ًں“¦' },
  { id: 'stock', label: 'ط§ظ„ظ…ط®ط²ظˆظ†', emoji: 'ًںڈ­' },
  { id: 'hr', label: 'ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©', emoji: 'ًں‘¥' },
  { id: 'crm', label: 'ط§ظ„ط¹ظ…ظ„ط§ط، ظˆط§ظ„طھط³ظˆظٹظ‚', emoji: 'ًںژپ' },
  { id: 'ai', label: 'ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ', emoji: 'ًں§ ' },
  { id: 'enterprise', label: 'ط§ظ„ظ‚ط·ط§ط¹ط§طھ ط§ظ„ظ…طھط®طµطµط©', emoji: 'ًںڈ¢' },
  { id: 'admin', label: 'ط§ظ„ط¥ط¯ط§ط±ط©', emoji: 'âڑ™ï¸ڈ' },
];

const modulesList = [
  { cat: 'finance', icon: <Calculator size={18}/>, title: "ط§ظ„ظ…ط­ط§ط³ط¨ط© ط§ظ„ظ…ط§ظ„ظٹط©", desc: "ظ‚ظٹظˆط¯ ظٹظˆظ…ظٹط© ظˆط´ط¬ط±ط© ط­ط³ط§ط¨ط§طھ ظ…طھط¹ط¯ط¯ط© ط§ظ„ظ…ط³طھظˆظٹط§طھ" },
  { cat: 'finance', icon: <Building size={18}/>, title: "ط§ظ„ط­ط³ط§ط¨ط§طھ ط§ظ„ط¨ظ†ظƒظٹط©", desc: "طھطھط¨ط¹ ط§ظ„ط£ط±طµط¯ط© ظˆط§ظ„طھط³ظˆظٹط§طھ ط§ظ„ط¨ظ†ظƒظٹط©" },
  { cat: 'finance', icon: <BarChart2 size={18}/>, title: "ظ…ظٹط²ط§ظ† ط§ظ„ظ…ط±ط§ط¬ط¹ط©", desc: "Drill-Down ط­طھظ‰ ط§ظ„ظ‚ظٹط¯ ط§ظ„ط£طµظ„ظٹ" },
  { cat: 'finance', icon: <Globe size={18}/>, title: "ط§ظ„ط§ط¹طھظ…ط§ط¯ط§طھ ط§ظ„ظ…ط³طھظ†ط¯ظٹط© (LC)", desc: "طھظƒط§ظ„ظٹظپ ط§ظ„ط§ط³طھظٹط±ط§ط¯ ظˆط§ظ„ط´ط­ظ† ظˆط§ظ„طھط®ظ„ظٹطµ" },
  { cat: 'finance', icon: <Briefcase size={18}/>, title: "ط§ظ„ط£طµظˆظ„ ط§ظ„ط«ط§ط¨طھط©", desc: "ط§ط­طھط³ط§ط¨ ط§ظ„ط§ظ‡طھظ„ط§ظƒ ظˆط³ظ†ط¯ط§طھ ط§ظ„طھط®ط±ظٹط¯" },
  { cat: 'finance', icon: <LineChart size={18}/>, title: "ط§ظ„ظ…ظˆط§ط²ظ†ط§طھ ط§ظ„طھظ‚ط¯ظٹط±ظٹط©", desc: "ط±ظ‚ط§ط¨ط© ظ…ط§ظ„ظٹط© ظˆظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظپط¹ظ„ظٹ ط¨ط§ظ„ظ…طھظˆظ‚ط¹" },
  { cat: 'finance', icon: <Wallet size={18}/>, title: "ط§ظ„ط¹ظ‡ط¯ ظˆط§ظ„ظ†ط«ط±ظٹط§طھ", desc: "طµط±ظپ ظˆطھط³ظˆظٹط© ظ…طµط§ط±ظٹظپ ط§ظ„ظپط±ظˆط¹" },
  { cat: 'finance', icon: <CreditCard size={18}/>, title: "ط§ظ„ظ…طµط±ظˆظپط§طھ ط§ظ„ط¹ظ…ظˆظ…ظٹط©", desc: "طھط³ط¬ظٹظ„ ظˆطھط¨ظˆظٹط¨ ط§ظ„ظ…طµط±ظˆظپط§طھ ط§ظ„ظٹظˆظ…ظٹط©" },
  { cat: 'finance', icon: <ShieldCheck size={18}/>, title: "ط§ظ„ط®ط²ظٹظ†ط© ظˆط§ظ„طµظ†ط§ط¯ظٹظ‚", desc: "ط¹ط±ط¶ ط¨ط§ظ†ظˆط±ط§ظ…ظٹ ظ„ظ„ظ†ظ‚ط¯ ظپظٹ ط§ظ„ظپط±ظˆط¹" },
  { cat: 'finance', icon: <FileCheck size={18}/>, title: "ط§ظ„ظ…ط·ط§ط¨ظ‚ط© ط§ظ„ط¨ظ†ظƒظٹط©", desc: "Auto Match ظ„ظƒط´ظˆظپط§طھ ط§ظ„ط¨ظ†ظƒ" },
  { cat: 'finance', icon: <CheckSquare size={18}/>, title: "ط§ظ„ط´ظٹظƒط§طھ", desc: "طھطھط¨ط¹ ط£ظˆط±ط§ظ‚ ط§ظ„ظ‚ط¨ط¶ ظˆط§ظ„ط¯ظپط¹ ظƒط§ظ…ظ„ط§ظ‹" },
  { cat: 'finance', icon: <History size={18}/>, title: "ط£ظ‚ط³ط§ط· ط§ظ„ط¹ظ…ظ„ط§ط،", desc: "ط¬ط¯ظˆظ„ط© ط§ظ„طھظ…ظˆظٹظ„ ظˆظ…طھط§ط¨ط¹ط© ط§ظ„طھط­طµظٹظ„" },
  { cat: 'finance', icon: <FileText size={18}/>, title: "ط³ظ†ط¯ط§طھ ط§ظ„ظ‚ط¨ط¶ ظˆط§ظ„ط¯ظپط¹", desc: "ط³ظ†ط¯ ظˆط§ط­ط¯ ظٹط³ط¯ط¯ ظپظˆط§طھظٹط± ظ…طھط¹ط¯ط¯ط©" },
  { cat: 'sales', icon: <ShoppingCart size={18}/>, title: "ط§ظ„ظ…ط¨ظٹط¹ط§طھ B2B", desc: "ظپظˆطھط±ط© ZATCA Phase 2 ظƒط§ظ…ظ„ط©" },
  { cat: 'sales', icon: <LayoutDashboard size={18}/>, title: "ظ†ظ‚ط·ط© ط§ظ„ط¨ظٹط¹ POS", desc: "ط¨ط§ط±ظƒظˆط¯ ط³ط±ظٹط¹ ظˆط£ظˆظپظ„ط§ظٹظ† ظ…ط²ط§ظ…ظ†" },
  { cat: 'sales', icon: <Clock size={18}/>, title: "ط§ظ„ظˆط±ط¯ظٹط§طھ ظˆط§ظ„ط¥ط؛ظ„ط§ظ‚", desc: "ط­ظ…ط§ظٹط© ظ…ط§ظ„ظٹط© ظ„ظ†ظ‡ط§ظٹط© ط§ظ„ط¯ظˆط§ظ…" },
  { cat: 'sales', icon: <Archive size={18}/>, title: "ط£ط±ط´ظٹظپ ط§ظ„ظ…ط¨ظٹط¹ط§طھ", desc: "XML ظ„ظ„ط²ظƒط§ط© ظˆط¨ط­ط« ظ…طھظ‚ط¯ظ…" },
  { cat: 'sales', icon: <Sliders size={18}/>, title: "ط®ظٹط§ط±ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ", desc: "ط³ظٹط§ط³ط§طھ ط§ظ„ط®طµظ… ظˆط§ظ„ط§ط¦طھظ…ط§ظ†" },
  { cat: 'sales', icon: <ClipboardList size={18}/>, title: "ط£ظˆط§ظ…ط± ط§ظ„ط¨ظٹط¹ (SO)", desc: "ط­ط¬ط² ط§ظ„ظ…ط®ط²ظˆظ† ظ„ظ„ط¹ظ…ظ„ط§ط،" },
  { cat: 'sales', icon: <Truck size={18}/>, title: "ظ…ط°ظƒط±ط§طھ ط§ظ„طھط³ظ„ظٹظ…", desc: "طھطھط¨ط¹ ط§ظ„طھط³ظ„ظٹظ… ط§ظ„ط¬ط²ط¦ظٹ ظ„ظ„ظ…ط´ط§ط±ظٹط¹" },
  { cat: 'sales', icon: <Map size={18}/>, title: "ظ…ط³ط§ط±ط§طھ ط§ظ„طھظˆط²ظٹط¹", desc: "ط®ط·ظˆط· ط³ظٹط± ظ…ظ†ط¯ظˆط¨ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ" },
  { cat: 'sales', icon: <Target size={18}/>, title: "ط£ظ‡ط¯ط§ظپ ط§ظ„ظ…ط¨ظٹط¹ط§طھ", desc: "ظ‚ظٹط§ط³ ط£ط¯ط§ط، ط§ظ„ظ…ظ†ط¯ظˆط¨ظٹظ† ظ„ط­ط¸ظٹط§ظ‹" },
  { cat: 'sales', icon: <RefreshCcw size={18}/>, title: "ظ…ط±طھط¬ط¹ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ", desc: "ط¥ط´ط¹ط§ط±ط§طھ ط¯ط§ط¦ظ†ط© ظˆط¥ط¹ط§ط¯ط© ظ„ظ„ظ…ط®ط²ظˆظ†" },
  { cat: 'sales', icon: <Repeat size={18}/>, title: "ط§ظ„ظپظˆط§طھظٹط± ط§ظ„ظ…طھظƒط±ط±ط©", desc: "ط£طھظ…طھط© ظپظˆط§طھظٹط± ط§ظ„ط§ط´طھط±ط§ظƒط§طھ" },
  { cat: 'sales', icon: <Receipt size={18}/>, title: "ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط±", desc: "طھط­ظˆظٹظ„ ط§ظ„ط¹ط±ط¶ ظ„ظپط§طھظˆط±ط© ط¨ظ†ظ‚ط±ط©" },
  { cat: 'purchases', icon: <FileEdit size={18}/>, title: "ط·ظ„ط¨ط§طھ ط§ظ„ط´ط±ط§ط، (PR)", desc: "ط¯ظˆط±ط© ط§ط¹طھظ…ط§ط¯ ط§ط­طھظٹط§ط¬ط§طھ ط§ظ„ط£ظ‚ط³ط§ظ…" },
  { cat: 'purchases', icon: <Inbox size={18}/>, title: "ط¹ط±ظˆط¶ ط§ظ„ظ…ظˆط±ط¯ظٹظ† (RFQ)", desc: "ظ…ظ‚ط§ط±ظ†ط© ط¹ظ…ظٹط§ط، ط¨ظٹظ† ط§ظ„ظ…ظˆط±ط¯ظٹظ†" },
  { cat: 'purchases', icon: <Receipt size={18}/>, title: "ط£ظˆط§ظ…ط± ط§ظ„ط´ط±ط§ط، (PO)", desc: "طھط£ظƒظٹط¯ ط§ظ„ظƒظ…ظٹط§طھ ظˆط§ظ„ط£ط³ط¹ط§ط± ظ„ظ„ظ…ظˆط±ط¯" },
  { cat: 'purchases', icon: <ShoppingCart size={18}/>, title: "ظپظˆط§طھظٹط± ط§ظ„ظ…ط´طھط±ظٹط§طھ", desc: "ط¥ط¯ط®ط§ظ„ ظ…ط¨ط§ط´ط± ظ…ط¹ ط±ط¨ط· ظ…ط­ط§ط³ط¨ظٹ" },
  { cat: 'purchases', icon: <CheckSquare size={18}/>, title: "ط§ط³طھظ„ط§ظ… ط§ظ„ط¨ط¶ط§ط¹ط© (GRN)", desc: "ظ…ط·ط§ط¨ظ‚ط© ط§ظ„ظƒظ…ظٹط§طھ ظˆظپط­طµ ط§ظ„ط¬ظˆط¯ط©" },
  { cat: 'purchases', icon: <RefreshCcw size={18}/>, title: "ظ…ط±طھط¬ط¹ط§طھ ط§ظ„ظ…ط´طھط±ظٹط§طھ", desc: "ط¥ط´ط¹ط§ط± ظ…ط¯ظٹظ† ظ„ظ„ظ…ظˆط±ط¯ ظˆطھط³ظˆظٹط©" },
  { cat: 'purchases', icon: <Settings size={18}/>, title: "ط®ظٹط§ط±ط§طھ ط§ظ„ظ…ط´طھط±ظٹط§طھ", desc: "ط³ظٹط§ط³ط§طھ ط§ظ„ظ…ظˆط§ظپظ‚ط§طھ ظˆط§ظ„ط­ط¯ظˆط¯ ط§ظ„ظ…ط§ظ„ظٹط©" },
  { cat: 'stock', icon: <Package size={18}/>, title: "ط¨ط·ط§ظ‚ط§طھ ط§ظ„ظ…ظ†طھط¬ط§طھ", desc: "Matrix + ظˆط­ط¯ط§طھ طھط­ظˆظٹظ„ ظ…طھط¹ط¯ط¯ط©" },
  { cat: 'stock', icon: <Building size={18}/>, title: "ط§ظ„ظ…ط³طھظˆط¯ط¹ط§طھ ظˆط§ظ„ظپط±ظˆط¹", desc: "ظ‡ظٹظƒظ„ ط´ط¬ط±ظٹ + طµظ„ط§ط­ظٹط§طھ ظ…ط¹ط²ظˆظ„ط©" },
  { cat: 'stock', icon: <BellRing size={18}/>, title: "طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ظ†ظ‚طµ", desc: "ط±ط§ط¯ط§ط± ظ…ط®ط²ظˆظ† ط°ظƒظٹ ظˆظ…طھط§ط¨ط¹ط©" },
  { cat: 'stock', icon: <Database size={18}/>, title: "ط§ظ„ط£ط±طµط¯ط© ط§ظ„ط­ظٹط©", desc: "ظ…طھط§ط­طŒ ظ…ط­ط¬ظˆط²طŒ ظ…ط¨ط§ط¹ ظ„ط­ط¸ظٹط§ظ‹" },
  { cat: 'stock', icon: <Activity size={18}/>, title: "ط­ط±ظƒط§طھ ط§ظ„ظ…ط®ط²ظˆظ†", desc: "طھطھط¨ط¹ ظƒظ„ ط¹ظ…ظ„ظٹط© ط¯ط®ظˆظ„ ظˆط®ط±ظˆط¬" },
  { cat: 'stock', icon: <Sliders size={18}/>, title: "طھط³ظˆظٹط§طھ ط§ظ„ط¬ط±ط¯", desc: "طھطµط­ظٹط­ ط§ظ„ظپظˆط§ط±ظ‚ ط¨ظ‚ظٹظˆط¯ ظ…ط­ط§ط³ط¨ظٹط©" },
  { cat: 'stock', icon: <Layers size={18}/>, title: "طھط­ظˆظٹظ„ط§طھ ط§ظ„ظ…ط®ط²ظˆظ†", desc: "ظ†ظ‚ظ„ ط§ظ„ط¨ط¶ط§ط¹ط© ط¨ظٹظ† ط§ظ„ظپط±ظˆط¹" },
  { cat: 'stock', icon: <CheckSquare size={18}/>, title: "ط§ظ„ط¬ط±ط¯ ط§ظ„ظ…ط®ط²ظ†ظٹ", desc: "ط¯ظˆط±ط© ط¬ط±ط¯ ظƒط§ظ…ظ„ط© ظ…ظ† ط§ظ„طھط®ط·ظٹط· ظ„ظ„ط¥ط؛ظ„ط§ظ‚" },
  { cat: 'stock', icon: <Camera size={18}/>, title: "ط§ظ„ط¬ط±ط¯ ط¨ط§ظ„ط±ط¤ظٹط© ط§ظ„ط°ظƒظٹط©", desc: "ظ…ط³ط­ ظƒط§ظ…ظٹط±ط§ AI ظ„طھط³ط±ظٹط¹ ط§ظ„ط¬ط±ط¯ 80%" },
  { cat: 'stock', icon: <Barcode size={18}/>, title: "ط§ظ„ط¨ط§ط±ظƒظˆط¯ ظˆط§ظ„ظ…ظ„طµظ‚ط§طھ", desc: "ط·ط¨ط§ط¹ط© ط¬ظ…ط§ط¹ظٹط© EAN/QR/Code128" },
  { cat: 'stock', icon: <Hourglass size={18}/>, title: "طھظˆط§ط±ظٹط® ط§ظ„طµظ„ط§ط­ظٹط©", desc: "FEFO طھظ„ظ‚ط§ط¦ظٹ ظˆطھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ط§ظ†طھظ‡ط§ط،" },
  { cat: 'stock', icon: <Hash size={18}/>, title: "ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„طھط³ظ„ط³ظ„ظٹط©", desc: "طھطھط¨ط¹ ط§ظ„ظˆط­ط¯ط© ظ…ظ† ط§ظ„ظ…ظˆط±ط¯ ظ„ظ„ط¹ظ…ظٹظ„" },
  { cat: 'stock', icon: <LayoutDashboard size={18}/>, title: "WMS ط§ظ„ظ…طھظ‚ط¯ظ…", desc: "ط£ط±ظپظپ ظˆظ…ظˆط§ظ‚ط¹ ظˆطھظˆط¬ظٹظ‡ ط§ظ„ط¹ظ…ط§ظ„" },
  { cat: 'stock', icon: <GitMerge size={18}/>, title: "ط§ظ„طھط­ظˆظٹظ„ط§طھ ط§ظ„ط°ظƒظٹط©", desc: "طھظˆط§ط²ظ† ط§ظ„ظ…ط®ط²ظˆظ† طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ط¨ظٹظ† ط§ظ„ظپط±ظˆط¹" },
  { cat: 'stock', icon: <Settings size={18}/>, title: "ط®ظٹط§ط±ط§طھ ط§ظ„ظ…ط³طھظˆط¯ط¹ط§طھ", desc: "FIFO/ظ…طھظˆط³ط· ظˆط§ظ„ط¨ظٹط¹ ط¨ظ„ط§ ظ…ط®ط²ظˆظ†" },
  { cat: 'hr', icon: <Users size={18}/>, title: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†", desc: "ظ…ظ„ظپ ظ…طھظƒط§ظ…ظ„ ظ…ظ† ط§ظ„طھط¹ظٹظٹظ† ظ„ظ„طھظ‚ط§ط¹ط¯" },
  { cat: 'hr', icon: <DollarSign size={18}/>, title: "ظ…ط³ظٹط±ط§طھ ط§ظ„ط±ظˆط§طھط¨", desc: "WPS ظ…طھظˆط§ظپظ‚ ظˆظ‚ظٹط¯ ظ…ط­ط§ط³ط¨ظٹ ط¢ظ„ظٹ" },
  { cat: 'hr', icon: <Fingerprint size={18}/>, title: "ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„ط§ظ†طµط±ط§ظپ", desc: "ط±ط¨ط· ZKTeco ظˆط§ظ„ط¨طµظ…ط© ط§ظ„ظˆط¬ظ‡ظٹط©" },
  { cat: 'hr', icon: <CalendarDays size={18}/>, title: "ط§ظ„ط¥ط¬ط§ط²ط§طھ ظˆط§ظ„ط؛ظٹط§ط¨", desc: "ط·ظ„ط¨ ظˆط§ط¹طھظ…ط§ط¯ ظˆط±طµظٹط¯ طھظ„ظ‚ط§ط¦ظٹ" },
  { cat: 'hr', icon: <CreditCard size={18}/>, title: "ط³ظ„ظپ ط§ظ„ظ…ظˆط¸ظپظٹظ†", desc: "ط¬ط¯ظˆظ„ط© ط§ط³طھظ‚ط·ط§ط¹ ط´ظ‡ط±ظٹ ظ…ظ† ط§ظ„ط±ط§طھط¨" },
  { cat: 'hr', icon: <BookOpen size={18}/>, title: "ط¨ط±ط§ظ…ط¬ ط§ظ„طھط¯ط±ظٹط¨", desc: "ط±ط¨ط· ط§ظ„طھط¯ط±ظٹط¨ ط¨ط§ظ„ظ…ط³ط§ط± ط§ظ„ظˆط¸ظٹظپظٹ" },
  { cat: 'hr', icon: <Star size={18}/>, title: "طھظ‚ظٹظٹظ… ط§ظ„ط£ط¯ط§ط، KPI", desc: "ظ…ط¤ط´ط±ط§طھ ظ…ظˆط¶ظˆط¹ظٹط© ظ…ط±طھط¨ط·ط© ط¨ط§ظ„ط­ظˆط§ظپط²" },
  { cat: 'hr', icon: <Briefcase size={18}/>, title: "ط§ظ„ظˆط¸ط§ط¦ظپ ظˆط§ظ„طھظˆط¸ظٹظپ", desc: "ط¥ط¹ظ„ط§ظ† ط§ظ„ظˆط¸ط§ط¦ظپ ظˆط§ط³طھظ‚ط¨ط§ظ„ ط§ظ„ط·ظ„ط¨ط§طھ" },
  { cat: 'hr', icon: <Cpu size={18}/>, title: "ط§ظ„طھط³ط¬ظٹظ„ ط§ظ„ظˆط¬ظ‡ظٹ AI", desc: "ط¨طµظ…ط© ط§ظ„ظˆط¬ظ‡ ط¨ط¯ظ‚ط© 99.9%" },
  { cat: 'crm', icon: <UserCheck size={18}/>, title: "ط§ظ„ط¹ظ…ظ„ط§ط، ظˆظƒط¨ط§ط± ط§ظ„ظ…ط´طھط±ظٹظ†", desc: "ظ…ظ„ظپ ط§ط¦طھظ…ط§ظ†ظٹ ظƒط§ظ…ظ„ ظˆط­ط¯ ط§ظ„ظ…ط¯ظٹظˆظ†ظٹط©" },
  { cat: 'crm', icon: <Target size={18}/>, title: "ظپط±طµ ط§ظ„ط¨ظٹط¹ (CRM Leads)", desc: "ظ‚ظ…ط¹ ظ…ط¨ظٹط¹ط§طھ ظ…ظ† ط§ظ„ط§ظ‡طھظ…ط§ظ… ظ„ظ„ط¥ط؛ظ„ط§ظ‚" },
  { cat: 'crm', icon: <Award size={18}/>, title: "ط¨ط±ظ†ط§ظ…ط¬ ظ†ظ‚ط§ط· ط§ظ„ظˆظ„ط§ط،", desc: "ظ…ظƒط§ظپط¢طھ طھط­ظپظٹط² طھظ„ظ‚ط§ط¦ظٹط© ظ„ظ„ط¹ظ…ظ„ط§ط،" },
  { cat: 'crm', icon: <Gift size={18}/>, title: "ط¨ط·ط§ظ‚ط§طھ ط§ظ„ظ‡ط¯ط§ظٹط§", desc: "ط¥طµط¯ط§ط± ظˆطھطھط¨ط¹ ط±طµظٹط¯ ط§ظ„ط¨ط·ط§ظ‚ط§طھ" },
  { cat: 'crm', icon: <CheckSquare size={18}/>, title: "ط§ظ„ظƒظˆط¨ظˆظ†ط§طھ ظˆط£ظƒظˆط§ط¯ ط§ظ„ط®طµظ…", desc: "ط§ط³طھظ‡ط¯ط§ظپ ط´ط±ط§ط¦ط­ ط¨ط¹ط±ظˆط¶ ط­طµط±ظٹط©" },
  { cat: 'crm', icon: <Megaphone size={18}/>, title: "ط§ظ„ط¹ط±ظˆط¶ ط§ظ„طھط±ظˆظٹط¬ظٹط©", desc: "ط§ط´طھط±ظٹ 2 ظˆط§ط­طµظ„ ط¹ظ„ظ‰ 1 طھظ„ظ‚ط§ط¦ظٹط§ظ‹" },
  { cat: 'crm', icon: <LinkIcon size={18}/>, title: "ط§ظ„طھط³ظˆظٹظ‚ ط¨ط§ظ„ط¹ظ…ظˆظ„ط©", desc: "ط´ط¨ظƒط© ط´ط±ظƒط§ط، طھط¹ظ…ظ„ ط¹ظ„ظ‰ ط§ظ„ط£ط¯ط§ط،" },
  { cat: 'crm', icon: <History size={18}/>, title: "ط£ظ‚ط³ط§ط· ظˆظ…ط¯ظٹظˆظ†ظٹط§طھ", desc: "ط¬ط¯ط§ظˆظ„ ط³ط¯ط§ط¯ ظˆطھظ†ط¨ظٹظ‡ط§طھ طھظ„ظ‚ط§ط¦ظٹط©" },
  { cat: 'ai', icon: <TrendingUp size={18}/>, title: "ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط§ظ„ظٹ ط§ظ„ط°ظƒظٹ", desc: "طھط´ط®ظٹطµ ظ…ط§ظ„ظٹ ظˆطھظˆطµظٹط§طھ ط§ط³طھط±ط§طھظٹط¬ظٹط©" },
  { cat: 'ai', icon: <Building size={18}/>, title: "ظ…ط­ظ„ظ„ ظƒط´ظپ ط§ظ„ط¨ظ†ظƒ AI", desc: "طھطµظ†ظٹظپ ط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ طھظ„ظ‚ط§ط¦ظٹط§ظ‹" },
  { cat: 'ai', icon: <Eye size={18}/>, title: "ظƒط´ظپ ط§ظ„ط§ط­طھظٹط§ظ„ AI", desc: "ط±ط§ط¯ط§ط± ط°ظƒظٹ ظ„ظ„طھظ„ط§ط¹ط¨ ظˆط§ظ„ط´ط°ظˆط°" },
  { cat: 'ai', icon: <Network size={18}/>, title: "ط³ظ„ط³ظ„ط© ط§ظ„طھظˆط±ظٹط¯ AI", desc: "طھظ†ط¨ط¤ ط§ظ„ط·ظ„ط¨ ظˆطھط­ط³ظٹظ† ط§ظ„ط´ط±ط§ط،" },
  { cat: 'ai', icon: <Bot size={18}/>, title: "ط§ظ„ظ…ط³ط§ط¹ط¯ ط§ظ„ط°ظƒظٹ AI", desc: "Copilot ط¯ط§ط®ظ„ ظƒظ„ ط´ط§ط´ط©" },
  { cat: 'ai', icon: <MessageCircle size={18}/>, title: "ط¨ظˆطھ طھظٹظ„ظٹط¬ط±ط§ظ…", desc: "طھظ‚ط§ط±ظٹط± ظˆظ…ظˆط§ظپظ‚ط§طھ ط¹ط¨ط± ط§ظ„ط¨ظˆطھ" },
  { cat: 'enterprise', icon: <Factory size={18}/>, title: "ط£ظˆط§ظ…ط± ط§ظ„طھطµظ†ظٹط¹", desc: "طھطھط¨ط¹ ط§ظ„ط¥ظ†طھط§ط¬ ظˆط§ط­طھط³ط§ط¨ ط§ظ„طھظƒظ„ظپط©" },
  { cat: 'enterprise', icon: <Cpu size={18}/>, title: "طھط®ط·ظٹط· ط§ظ„ظ…ظˆط§ط±ط¯ MRP", desc: "ط­ط³ط§ط¨ ط§ظ„ط§ط­طھظٹط§ط¬ ظˆطھظˆظ„ظٹط¯ ط·ظ„ط¨ط§طھ ط§ظ„ط´ط±ط§ط،" },
  { cat: 'enterprise', icon: <BookOpen size={18}/>, title: "ظˆطµظپط§طھ ط§ظ„طھطµظ†ظٹط¹ (BOM)", desc: "ظ…ظƒظˆظ†ط§طھ ظƒظ„ ظ…ظ†طھط¬ ط¨ط§ظ„ظƒظ…ظٹط§طھ ط§ظ„ط¯ظ‚ظٹظ‚ط©" },
  { cat: 'enterprise', icon: <CheckSquare size={18}/>, title: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط´ط§ط±ظٹط¹", desc: "ظ…ط±ط§ط­ظ„ ظˆطھظ‚ط¯ظ… ظˆظ…ط³طھط®ظ„طµط§طھ ط¯ظپط¹ظٹط©" },
  { cat: 'enterprise', icon: <CheckCircle size={18}/>, title: "ط¶ط¨ط· ط§ظ„ط¬ظˆط¯ط© (QC)", desc: "ظپط­طµ ط§ظ„ط¨ط¶ط§ط¹ط© ط§ظ„ظˆط§ط±ط¯ط© ظ‚ط¨ظ„ ط§ظ„ظ‚ط¨ظˆظ„" },
  { cat: 'enterprise', icon: <Wrench size={18}/>, title: "ظ†ط¸ط§ظ… ط§ظ„طµظٹط§ظ†ط©", desc: "ط·ظ„ط¨ط§طھ ط®ط¯ظ…ط© ظˆط¥طµط¯ط§ط± ط§ظ„ظپط§طھظˆط±ط©" },
  { cat: 'enterprise', icon: <Truck size={18}/>, title: "ط£ط³ط·ظˆظ„ ط§ظ„ظ…ط±ظƒط¨ط§طھ", desc: "طھظƒط§ظ„ظٹظپ ط§ظ„طھط´ط؛ظٹظ„ ظˆط¬ط¯ظˆظ„ط© ط§ظ„طµظٹط§ظ†ط©" },
  { cat: 'enterprise', icon: <Database size={18}/>, title: "ط¥ط¯ط§ط±ط© ط§ظ„ظˆظ‚ظˆط¯", desc: "ظƒط´ظپ ط´ط°ظˆط° ط§ط³طھظ‡ظ„ط§ظƒ ط§ظ„ظˆظ‚ظˆط¯" },
  { cat: 'enterprise', icon: <Map size={18}/>, title: "ط±ط­ظ„ط§طھ ط§ظ„ط£ط³ط·ظˆظ„", desc: "طھظˆط«ظٹظ‚ ط§ظ„ط±ط­ظ„ط§طھ ظˆطھظƒظ„ظپط© ط§ظ„ط³ط§ط¦ظ‚" },
  { cat: 'enterprise', icon: <Home size={18}/>, title: "ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ‚ط§ط±ط§طھ", desc: "ط¹ظ‚ظˆط¯ ط¥ظٹط¬ط§ط± ظˆط¹ط§ط¦ط¯ ط§ط³طھط«ظ…ط§ط±ظٹ" },
  { cat: 'enterprise', icon: <FileText size={18}/>, title: "ط¹ظ‚ظˆط¯ ط§ظ„ط¥ظٹط¬ط§ط± IFRS 16", desc: "ط§ظ„طھط²ط§ظ…ط§طھ ط§ظ„ط¥ظٹط¬ط§ط± ظ…ط¹ظٹط§ط±ظٹ" },
  { cat: 'enterprise', icon: <History size={18}/>, title: "ط£ظ‚ط³ط§ط· ط§ظ„ط¹ظ‚ط§ط±ط§طھ", desc: "طھط­طµظٹظ„ ط§ظ„ظ…ط³طھط«ظ…ط±ظٹظ† ظپظٹ ط§ظ„ظ…ط´ط§ط±ظٹط¹" },
  { cat: 'enterprise', icon: <BookOpen size={18}/>, title: "ط§ظ„ظپطµظˆظ„ ط§ظ„ط¯ط±ط§ط³ظٹط©", desc: "ط¬ط¯ط§ظˆظ„ ظˆط­ط¶ظˆط± ط§ظ„ط·ظ„ط§ط¨" },
  { cat: 'enterprise', icon: <Users size={18}/>, title: "ط§ظ„ط·ظ„ط§ط¨ ظˆط§ظ„ط±ط³ظˆظ…", desc: "ظ…ظ„ظپط§طھ ط§ظ„ط·ظ„ط§ط¨ ظˆطھط­طµظٹظ„ ط§ظ„ظ…ط¯ظٹظˆظ†ظٹط§طھ" },
  { cat: 'enterprise', icon: <CalendarDays size={18}/>, title: "ط§ظ„ط­ط¬ظˆط²ط§طھ ظˆط§ظ„ظ…ظˆط§ط¹ظٹط¯", desc: "ط¬ط¯ظˆظ„ط© ط¨ظ„ط§ طھط¯ط§ط®ظ„ ظˆطھط£ظƒظٹط¯ط§طھ طھظ„ظ‚ط§ط¦ظٹط©" },
  { cat: 'enterprise', icon: <Clock size={18}/>, title: "طھظ‚ظˆظٹظ… ط§ظ„ط­ط¬ظˆط²ط§طھ", desc: "ط¹ط±ط¶ ط¨طµط±ظٹ ظٹظˆظ…ظٹ ظˆط£ط³ط¨ظˆط¹ظٹ ظˆط´ظ‡ط±ظٹ" },
  { cat: 'admin', icon: <LayoutDashboard size={18}/>, title: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ… ط§ظ„ط±ط¦ظٹط³ظٹط©", desc: "ظ…ط¤ط´ط±ط§طھ ط§ظ„ط£ط¯ط§ط، ظˆط§ظ„طھظ†ط¨ظٹظ‡ط§طھ ظ„ط­ط¸ظٹط§ظ‹" },
  { cat: 'admin', icon: <Settings size={18}/>, title: "ظ…ط±ظƒط² ط§ظ„ظ‚ظٹط§ط¯ط© ظˆط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ", desc: "ط³ظٹط§ط³ط§طھ ط§ظ„ط´ط±ظƒط© ظˆط§ظ„ظ…ط¸ظ‡ط± ظˆط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†" },
  { cat: 'admin', icon: <Building size={18}/>, title: "ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ†ط´ط£ط©", desc: "طھط³ط¬ظٹظ„ ZATCA ظˆظ…ط¹ظ„ظˆظ…ط§طھ ظ‚ط§ظ†ظˆظ†ظٹط©" },
  { cat: 'admin', icon: <Layers size={18}/>, title: "ط§ظ„ظپط±ظˆط¹ ظˆظ†ظ‚ط§ط· ط§ظ„ط¨ظٹط¹", desc: "ط¹ط²ظ„ ط¥ظٹط±ط§ط¯ط§طھ ظˆط¨ظٹط§ظ†ط§طھ ظƒظ„ ظپط±ط¹" },
  { cat: 'admin', icon: <DollarSign size={18}/>, title: "ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ…ظ„ط§طھ", desc: "ط£ط³ط¹ط§ط± طµط±ظپ ظˆظ‚ظٹظˆط¯ ط§ظ„ظپط±ظˆظ‚" },
  { cat: 'admin', icon: <CheckSquare size={18}/>, title: "ظ†ط¸ط§ظ… ط§ظ„ظ…ظˆط§ظپظ‚ط§طھ", desc: "ظ…ط³ط§ط±ط§طھ ط§ط¹طھظ…ط§ط¯ ظ…طھط¹ط¯ط¯ط© ط§ظ„ظ…ط±ط§ط­ظ„" },
  { cat: 'admin', icon: <MessageCircle size={18}/>, title: "طھظƒط§ظ…ظ„ ظˆط§طھط³ط§ط¨", desc: "ظپظˆط§طھظٹط± ظˆط¥ط´ط¹ط§ط±ط§طھ ط¹ط¨ط± ظˆط§طھط³ط§ط¨" },
  { cat: 'admin', icon: <Eye size={18}/>, title: "ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", desc: "طھطھط¨ط¹ ظƒظ„ طھط¹ط¯ظٹظ„ ط¨ط²ظ…ظ†ظ‡ ظˆظ…ظڈظ†ظپظ‘ط°ظ‡" },
  { cat: 'admin', icon: <Activity size={18}/>, title: "طµط­ط© ط§ظ„ظ†ط¸ط§ظ…", desc: "ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ط®ظˆط§ط¯ظ… ظˆط²ظ…ظ† ط§ظ„ط§ط³طھط¬ط§ط¨ط©" },
  { cat: 'admin', icon: <BellRing size={18}/>, title: "ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ط°ظƒظٹط©", desc: "ظ…ط±ظƒط² طھط¬ظ…ظٹط¹ ظƒظ„ طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ظ†ط¸ط§ظ…" },
  { cat: 'admin', icon: <BarChart3 size={18}/>, title: "ظ…ط±ظƒط² ط§ظ„طھظ‚ط§ط±ظٹط±", desc: "50+ طھظ‚ط±ظٹط± ظ‚ط§ط¨ظ„ ظ„ظ„طھطµط¯ظٹط±" },
  { cat: 'admin', icon: <ShieldCheck size={18}/>, title: "ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…طھظ‚ط¯ظ…ط©", desc: "104 ظ‚ط³ظ… أ— ظ…ط³طھط®ط¯ظ… أ— طµظ„ط§ط­ظٹط©" },
];

const INDUSTRIES = [
  {
    id: 'pharmacy', emoji: 'ًں’ٹ', icon: <Pill size={26}/>,
    title: 'ط§ظ„طµظٹط¯ظ„ظٹط§طھ', titleEn: 'Pharmacies',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
    features: ['طھطھط¨ط¹ طھظˆط§ط±ظٹط® ط§ظ„طµظ„ط§ط­ظٹط© (FEFO)', 'ظ…ظ†ط¹ ط¨ظٹط¹ ط§ظ„ط¯ظˆط§ط، ط§ظ„ظ…ظ†طھظ‡ظٹ', 'ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط¯ط§ط¦ظ„ ط§ظ„ط·ط¨ظٹط©', 'ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„طھط³ظ„ط³ظ„ظٹط© ظ„ظ„ط£ط¯ظˆظٹط©', 'طھظ‚ط§ط±ظٹط± ظ…ط®ط²ظˆظ† ط¯ظˆط§ط¦ظٹ ظ…طھط®طµطµط©'],
    url: '/pharmacy'
  },
  {
    id: 'retail', emoji: 'ًں›’', icon: <ShoppingBag size={26}/>,
    title: 'ط§ظ„طھظ…ظˆظٹظ†ط§طھ ظˆط§ظ„ط­ظ„ظˆظٹط§طھ', titleEn: 'Grocery & Sweets',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    features: ['ط¥ط¯ط§ط±ط© ط¢ظ„ط§ظپ ط§ظ„ط£طµظ†ط§ظپ', 'ط±ط¨ط· ط§ظ„ظ…ظˆط§ط²ظٹظ† ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط©', 'ظ†ط¸ط§ظ… ظˆظ„ط§ط، ظˆط®طµظˆظ…ط§طھ ط°ظƒظٹط©', 'ط¬ط±ط¯ ظˆطھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ظ†ظ‚طµ', 'ط¨ط§ط±ظƒظˆط¯ ظˆظ…ظ„طµظ‚ط§طھ ط¬ظ…ط§ط¹ظٹط©'],
    url: '/retail'
  },
  {
    id: 'restaurant', emoji: 'ًںچ½ï¸ڈ', icon: <UtensilsCrossed size={26}/>,
    title: 'ط§ظ„ظ…ط·ط§ط¹ظ… ظˆط§ظ„ظƒط§ظپظٹظ‡ط§طھ', titleEn: 'Restaurants & Cafes',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700',
    features: ['ط®ط±ظٹط·ط© ط·ط§ظˆظ„ط§طھ طھظپط§ط¹ظ„ظٹط©', 'ط´ط§ط´ط© ظ…ط·ط¨ط® ط±ظ‚ظ…ظٹط© (KDS)', 'ظ…ظ†ظٹظˆ ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظ„ط­ط¸ظٹ', 'ط¥ط¯ط§ط±ط© ط§ظ„ظˆط¬ط¨ط§طھ ط§ظ„ظ…ط±ظƒط¨ط©', 'ط¯ط¹ظ… ط§ظ„طھظˆطµظٹظ„ ظˆط§ظ„ط·ظ„ط¨ط§طھ'],
    url: '/restaurant'
  },
  {
    id: 'factory', emoji: 'ًںڈ­', icon: <Factory size={26}/>,
    title: 'ط§ظ„ظ…طµط§ظ†ط¹ ظˆط§ظ„ط¥ظ†طھط§ط¬', titleEn: 'Manufacturing',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700',
    features: ['ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط§ط¯ BOM', 'طھطھط¨ط¹ ظ…ط±ط§ط­ظ„ ط§ظ„ط¥ظ†طھط§ط¬', 'ط­ط³ط§ط¨ طھظƒظ„ظپط© ط§ظ„طھطµظ†ظٹط¹', 'ط¥ط¯ط§ط±ط© ط§ظ„ظ‡ط§ظ„ظƒ ظˆط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط®ط§ظ…', 'طھط®ط·ظٹط· ظ…ظˆط§ط±ط¯ ط§ظ„ط¥ظ†طھط§ط¬ MRP'],
    url: '/factory'
  },
  {
    id: 'services', emoji: 'ًں”§', icon: <Cog size={26}/>,
    title: 'ط§ظ„ط®ط¯ظ…ط§طھ ظˆط§ظ„طµظٹط§ظ†ط©', titleEn: 'Services & Maintenance',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700',
    features: ['ظƒط§ط±ط¯ ط§ظ„ط¯ط®ظˆظ„ Job Card', 'طھطھط¨ط¹ ط­ط§ظ„ط© ط§ظ„ط£ط¬ظ‡ط²ط©', 'ط¬ط¯ظˆظ„ط© ط§ظ„ظ…ظˆط§ط¹ظٹط¯ ط§ظ„ط°ظƒظٹط©', 'ط¥ط¯ط§ط±ط© ظ‚ط·ط¹ ط§ظ„ط؛ظٹط§ط±', 'طھظ†ط¨ظٹظ‡ ط§ظ„ط¹ظ…ظٹظ„ ط¨ظˆط§طھط³ط§ط¨'],
    url: '/services'
  },
];

const POWER_CLUSTERS = [
  {
    emoji: 'ًں’°', icon: <Calculator size={22}/>,
    title: 'ط§ظ„ط³ظٹط·ط±ط© ط§ظ„ظ…ط§ظ„ظٹط©', titleEn: 'Financial Mastery',
    color: 'from-emerald-600 to-teal-700', count: 13,
    desc: 'ظˆط¯ط§ط¹ط§ظ‹ ظ„ظ„ط£ط®ط·ط§ط، ط§ظ„ط­ط³ط§ط¨ظٹط©. ظ†ط¸ط§ظ… ظ…ط­ط§ط³ط¨ظٹ ط¯ظ‚ظٹظ‚ ظ…ط¹ طھظ‚ط§ط±ظٹط± ط¶ط±ظٹط¨ظٹط© ظپظˆط±ظٹط©.',
    highlights: ['ظ‚ظٹظˆط¯ ظ…ط²ط¯ظˆط¬ط© ط¢ظ„ظٹط©', 'ظ…ط·ط§ط¨ظ‚ط© ط¨ظ†ظƒظٹط© Auto-Match', 'ط´ط¬ط±ط© ط­ط³ط§ط¨ط§طھ ظ…طھط¹ط¯ط¯ط©', 'طھظ‚ط§ط±ظٹط± ZATCA', 'ط§ظ„ظ…ظˆط§ط²ظ†ط§طھ ط§ظ„طھظ‚ط¯ظٹط±ظٹط©'],
  },
  {
    emoji: 'ًں“¦', icon: <Package size={22}/>,
    title: 'ظ‚ظˆط© ط§ظ„ظ…ط®ط²ظˆظ†', titleEn: 'Inventory Powerhouse',
    color: 'from-blue-600 to-indigo-700', count: 14,
    desc: 'طھط­ظƒظ… ظƒط§ظ…ظ„ ط¨ط§ظ„ظƒظ…ظٹط§طھ ظˆطھظˆط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط، ظˆظ…ظˆط§ظ‚ط¹ ط§ظ„ط£ط±ظپظپ.',
    highlights: ['ط¬ط±ط¯ ظ…طھط¹ط¯ط¯ ط§ظ„ظ…ط³طھظˆط¯ط¹ط§طھ', 'FEFO طھظ„ظ‚ط§ط¦ظٹ', 'WMS ط¨ط§ظ„ط£ط±ظپظپ ظˆط§ظ„ظ…ظˆط§ظ‚ط¹', 'طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ظ†ظ‚طµ ط§ظ„ط°ظƒظٹط©', 'ط¬ط±ط¯ ط¨ط§ظ„ظƒط§ظ…ظٹط±ط§ AI'],
  },
  {
    emoji: 'ًں›’', icon: <ShoppingCart size={22}/>,
    title: 'طھط¬ط±ط¨ط© ط§ظ„ط¨ظٹط¹', titleEn: 'Customer & POS',
    color: 'from-amber-600 to-orange-700', count: 19,
    desc: 'POS ظپط§ط¦ظ‚ ط§ظ„ط³ط±ط¹ط© ظ…ط¹ ظ†ط¸ط§ظ… ظˆظ„ط§ط، ظٹط¨ظ†ظٹ ط¹ظ„ط§ظ‚ط© ط·ظˆظٹظ„ط© ظ…ط¹ ط¹ظ…ظ„ط§ط¦ظƒ.',
    highlights: ['POS ط£ظˆظپظ„ط§ظٹظ† ظ…ط²ط§ظ…ظ†', 'ظ†ظ‚ط§ط· ط§ظ„ظˆظ„ط§ط، ظˆط§ظ„ظ…ظƒط§ظپط¢طھ', 'ط¨ط·ط§ظ‚ط§طھ ط§ظ„ظ‡ط¯ط§ظٹط§', 'CRM Leads', 'طھط§ط¨ظٹ ظˆطھظ…ط§ط±ط§ ظˆط³ظ„ط© ظˆط²ط¯'],
  },
  {
    emoji: 'âڑ™ï¸ڈ', icon: <Cog size={22}/>,
    title: 'ظƒظپط§ط،ط© ط§ظ„طھط´ط؛ظٹظ„', titleEn: 'Operational Excellence',
    color: 'from-rose-600 to-pink-700', count: 25,
    desc: 'ط£طھظ…طھط© ظƒط§ظ…ظ„ط© ظ…ظ† ط§ظ„ظ…ط§ط¯ط© ط§ظ„ط®ط§ظ… ظ„ظ„ظ…ظ†طھط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹ.',
    highlights: ['BOM ظˆط£ظˆط§ظ…ط± ط§ظ„طھطµظ†ظٹط¹', 'ط¥ط¯ط§ط±ط© ط§ظ„ط£ط³ط·ظˆظ„ ظˆط§ظ„ظˆظ‚ظˆط¯', 'ط±ظˆط§طھط¨ WPS ظˆط¨طµظ…ط© ZKTeco', 'طھطھط¨ط¹ ط§ظ„ظ…ط´ط§ط±ظٹط¹', 'Job Cards ط§ظ„طµظٹط§ظ†ط©'],
  },
  {
    emoji: 'ًں§ ', icon: <Brain size={22}/>,
    title: 'ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ', titleEn: 'AI & Analytics',
    color: 'from-violet-600 to-purple-700', count: 6,
    desc: 'ظ‚ط±ط± ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ط¨ظٹط§ظ†ط§طھ. AI ظٹظƒط´ظپ ط§ظ„طھظ„ط§ط¹ط¨ ظˆظٹطھظ†ط¨ط£ ط¨ط§ظ„ظ…ط¨ظٹط¹ط§طھ.',
    highlights: ['ظƒط´ظپ ط§ظ„ط§ط­طھظٹط§ظ„ AI', 'طھظ†ط¨ط¤ ط§ظ„ط·ظ„ط¨ AI', 'ظ…ط¯ظٹط± ظ…ط§ظ„ظٹ ط°ظƒظٹ', 'ط¨ظˆطھ طھظٹظ„ظٹط¬ط±ط§ظ…', 'Copilot ط¯ط§ط®ظ„ ظƒظ„ ط´ط§ط´ط©'],
  },
];

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function NamaInvestLanding() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Client-side fallback: redirect subdomain visitors to /login or /dashboard
  useEffect(() => {
    const host = window.location.hostname;
    if (host !== 'namainvist.com' && host !== 'www.namainvist.com' && host.endsWith('.namainvist.com')) {
      const token = document.cookie.split(';').some(c => c.trim().startsWith('token='));
      window.location.href = token ? '/dashboard' : '/login';
    }
  }, []);

  const filteredModules = useMemo(() => {
    return modulesList.filter(m => {
      const matchesTab = activeTab === 'all' || m.cat === activeTab;
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full m-0 p-0 min-h-screen overflow-x-hidden bg-slate-50 text-slate-900" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: '20px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        html { font-size: 26px !important; }
        .tab-scroll::-webkit-scrollbar { height: 0; }
        .ind-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .ind-card:hover { transform: translateY(-5px); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(79,70,229,0.4)} 50%{box-shadow:0 0 20px 6px rgba(79,70,229,0.2)} }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animate-pulse:hover { animation: none; }
        * { font-family: 'Noto Sans Arabic', sans-serif !important; }
      `}} />

      {/* NAV */}
      <nav className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900">ظ†ظ…ط§ ط¥ظ†ظپط³طھ</span>
                <span className="text-xs text-indigo-500 font-bold block leading-none">Nama Invest ERP</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 font-bold text-slate-600 text-sm">
            <a href="#industries" onClick={(e) => scrollToSection(e, 'industries')} className="hover:text-indigo-600 transition-colors">ط§ظ„ظ‚ط·ط§ط¹ط§طھ</a>
            <a href="#clusters" onClick={(e) => scrollToSection(e, 'clusters')} className="hover:text-indigo-600 transition-colors">ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ</a>
            <a href="#modules" onClick={(e) => scrollToSection(e, 'modules')} className="hover:text-indigo-600 transition-colors">ط§ظ„ظ€ 104 ظˆط­ط¯ط©</a>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors text-indigo-600 font-black">ًں’ژ ط§ظ„ط£ط³ط¹ط§ط±</Link>
          </div>

          {/* Action Buttons â€” Always visible */}
          <div className="flex gap-2 md:gap-3 items-center">
            <Link href="/sign-in" className="px-4 md:px-5 py-2 md:py-2.5 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-black rounded-xl transition-all duration-300 text-sm md:text-base">
              طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
            </Link>
            <Link href="/sign-up" className="px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-300 text-sm md:text-base animate-pulse hover:animate-none">
              ًںڑ€ ط³ط¬ظ‘ظ„ ظ…ط¬ط§ظ†ط§ظ‹
            </Link>
            <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" className="hidden lg:flex px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all items-center gap-2">
              <Phone className="w-5 h-5" /> طھظˆط§طµظ„ ظ…ط¹ظ†ط§
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:text-indigo-600 p-2">
               {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
             </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl fade-in flex flex-col p-4 gap-4">
            <a href="#industries" onClick={(e) => scrollToSection(e, 'industries')} className="font-bold text-slate-700 hover:text-indigo-600">ط§ظ„ظ‚ط·ط§ط¹ط§طھ ط§ظ„طھظٹ ظ†ط®ط¯ظ…ظ‡ط§</a>
            <a href="#clusters" onClick={(e) => scrollToSection(e, 'clusters')} className="font-bold text-slate-700 hover:text-indigo-600">ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ ط§ظ„ط®ظ…ط³ ط§ظ„ط§ط³طھط±ط§طھظٹط¬ظٹط©</a>
            <a href="#modules" onClick={(e) => scrollToSection(e, 'modules')} className="font-bold text-slate-700 hover:text-indigo-600">ظ‚ط§ط¦ظ…ط© ط§ظ„ظ€ 104 ظˆط­ط¯ط© ط¨ط±ظ…ط¬ظٹط©</a>
            <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-indigo-600 hover:text-indigo-700">ًں’ژ ط§ظ„ط¨ط§ظ‚ط§طھ ظˆط§ظ„ط£ط³ط¹ط§ط±</Link>
            <div className="h-px bg-slate-100 my-2"></div>
            <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-slate-700 text-center py-2">طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„</Link>
            <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-center border border-indigo-600 text-indigo-600 font-bold rounded-xl">طھط³ط¬ظٹظ„ ط­ط³ط§ط¨ ط¬ط¯ظٹط¯</Link>
            <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 text-center bg-amber-500 text-white font-bold rounded-xl">ًں’ژ ط¹ط±ط¶ ط§ظ„ط£ط³ط¹ط§ط± ظˆط§ظ„ط¨ط§ظ‚ط§طھ</Link>
            <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" className="px-4 py-3 text-center bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
               <Phone className="w-5 h-5" /> طھظˆط§طµظ„ ظ…ط¹ظ†ط§ ط§ظ„ط¢ظ†
            </a>
          </div>
        )}
      </nav>

      <main>
      {/* HERO */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}/>
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl"/>
        <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            ًںڑ€ ظ†ط¸ط§ظ… طھط´ط؛ظٹظ„ ط§ظ„ط£ط¹ظ…ط§ظ„ â€” ظ…طھظˆط§ظپظ‚ 100% ظ…ط¹ ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط© (ZATCA Phase 2)
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">ظ†ظ…ط§ ط¥ظ†ظپط³طھ</span>
            <br/>
            <span className="text-3xl md:text-4xl font-bold text-slate-300">ظ†ط¸ط§ظ… ظˆط§ط­ط¯ آ· ظ„ظƒظ„ ط§ظ„ط£ط¹ظ…ط§ظ„</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mb-3 leading-relaxed">
            NamaInvest â€” Comprehensive cloud ERP for Pharmacies, Grocery, Restaurants, Factories & Services. 104 integrated modules.
          </p>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mb-10 leading-relaxed">
            ظ…ظ† ظ†ظ‚ط§ط· ط§ظ„ط¨ظٹط¹ ظˆط§ظ„ظ…ط®ط²ظˆظ† ط§ظ„ظ…طھظ‚ط¯ظ… ط¥ظ„ظ‰ ط§ظ„ظ…ط­ط§ط³ط¨ط© ظˆط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط© ظˆط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ â€” ظƒظ„ ظ…ط§ طھط­طھط§ط¬ظ‡ ظپظٹ ظ…ظ†طµط© ط³ط­ط§ط¨ظٹط© ظˆط§ط­ط¯ط©.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {[
              { num: '104+', label: 'ظˆط­ط¯ط© ط¨ط±ظ…ط¬ظٹط©' },
              { num: '15', label: 'ظ‚ط·ط§ط¹ ط£ط¹ظ…ط§ظ„' },
              { num: '100%', label: 'ظ…طھظˆط§ظپظ‚ ZATCA' },
              { num: '24/7', label: 'ط¯ط¹ظ… ظپظ†ظٹ' },
            ].map((s,i) => (
              <div key={s.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 text-center min-w-[110px]">
                <div className="text-3xl font-black text-white">{s.num}</div>
                <div className="text-xs text-slate-400 font-bold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-4 w-full mt-4">
            <a href="/updates/desktop/NamaInvest-Setup-2.3.0.exe" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/40 transition-all text-lg min-w-[220px]">
              <Download size={20} /> ًںڑ€ ط¬ط±ط¨ ط§ظ„ظ†ط¸ط§ظ… ظ…ط¬ط§ظ†ط§ظ‹
            </a>
            <a href="#download" onClick={(e) => scrollToSection(e, 'download')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/40 transition-all text-lg min-w-[220px]">
              <Download size={20} /> طھط­ظ…ظٹظ„ ط§ظ„طھط·ط¨ظٹظ‚
            </a>
            <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/40 transition-all text-lg min-w-[220px]">
              ًں’ژ ط¹ط±ط¶ ط§ظ„ط¨ط§ظ‚ط§طھ ظˆط§ظ„ط£ط³ط¹ط§ط±
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ INDUSTRIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="industries" className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            ًںڈھ ط§ظ„ظ‚ط·ط§ط¹ط§طھ ط§ظ„طھظٹ ظ†ط®ط¯ظ…ظ‡ط§ â€” Industries We Serve
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-3">ظ…ظ‡ظ…ط§ ظƒط§ظ† ظ†ط´ط§ط·ظƒ.. ظ†ظ…ط§ ط¥ظ†ظپط³طھ ظٹظ†ط§ط³ط¨ظƒ</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            ط¨ظ†ظٹط© ظˆط­ط¯ط§طھظٹط© ظ…ط±ظ†ط© (Modular Architecture) طھطھظƒظٹظپ ظ…ط¹ ظƒظ„ ظ‚ط·ط§ط¹ طھط¬ط§ط±ظٹ
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
          {INDUSTRIES.map(ind => (
            <div
              key={ind.id}
              className={`ind-card rounded-2xl border-2 p-5 cursor-pointer flex flex-col items-center text-center ${
                activeIndustry === ind.id
                  ? `${ind.bg} ${ind.border} shadow-xl`
                  : 'bg-white border-slate-200 hover:shadow-lg hover:border-slate-300'
              }`}
              onClick={() => setActiveIndustry(activeIndustry === ind.id ? null : ind.id)}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${ind.color} text-white shadow-md`}>
                {ind.icon}
              </div>
              <h3 className={`font-black text-base mb-0.5 ${activeIndustry === ind.id ? ind.text : 'text-slate-800'}`}>
                {ind.emoji} {ind.title}
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-3">{ind.titleEn}</p>
              {activeIndustry === ind.id && (
                <div className="fade-in mt-2 pt-2 border-t border-slate-200 w-full flex flex-col items-center">
                  <ul className="space-y-1.5 mb-3 flex flex-col items-center text-center">
                    {ind.features.map((f, i) => (
                      <li key={f} className={`text-xs font-bold flex items-center justify-center gap-1.5 ${ind.text}`}>
                        <CheckCircle size={11} className="flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href={ind.url} 
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-[200px] mx-auto flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r ${ind.color}`}
                  >
                    ط§ط¹ط±ظپ ط£ظƒط«ط± <ArrowLeft size={11} />
                  </Link>
                </div>
              )}
              {activeIndustry !== ind.id && (
                <p className="text-xs text-slate-400 font-bold flex items-center justify-center gap-1 w-full mt-2">
                  ط§ط¶ط؛ط· ظ„ط¹ط±ط¶ ط§ظ„ظ…ظ…ظٹط²ط§طھ <ChevronDown size={11} />
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ POWER CLUSTERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="clusters" className="bg-slate-900 py-20 px-4">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              âڑ، ظ…ط¬ظ…ظˆط¹ط§طھ ط§ظ„ظ‚ظˆط© ط§ظ„ط®ظ…ط³ â€” 5 Power Clusters
            </div>
            <h2 className="text-4xl font-black text-white mb-3 text-center">ط§ظ„ظ€ 104 ظˆط­ط¯ط©.. ظ…ظ†ط¸ظ‘ظ…ط© ط¨ط°ظƒط§ط،</h2>
            <p className="text-slate-400 text-lg text-center">Five strategic clusters covering every aspect of your business</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 justify-items-center w-full">
            {POWER_CLUSTERS.map((c, i) => (
              <div key={c.titleEn} className={`rounded-2xl overflow-hidden cursor-pointer transition-all w-full flex flex-col text-center ${expandedCluster===i?'ring-2 ring-white/30 scale-[1.02]':''}`}
                onClick={() => setExpandedCluster(expandedCluster===i ? null : i)}>
                <div className={`bg-gradient-to-br ${c.color} p-5 text-white flex flex-col items-center`}>
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="text-2xl font-black opacity-80">{c.count}</span>
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">{c.icon}</div>
                  </div>
                  <h3 className="font-black text-base leading-tight mb-0.5 text-center">{c.title}</h3>
                  <p className="text-xs opacity-75 font-bold text-center">{c.titleEn}</p>
                </div>
                <div className="bg-slate-800 p-4 w-full flex flex-col items-center">
                  <p className="text-slate-300 text-xs leading-relaxed mb-3 text-center w-full">{c.desc}</p>
                  {expandedCluster === i ? (
                    <div className="fade-in w-full flex flex-col items-center">
                      <ul className="space-y-1.5 mb-3 flex flex-col items-center text-center">
                        {c.highlights.map((h, j) => (
                          <li key={h} className="flex items-center justify-center gap-1.5 text-xs text-slate-200 font-bold">
                            <CheckCircle size={11} className="flex-shrink-0 text-emerald-400" /> {h}
                          </li>
                        ))}
                      </ul>
                      <span className="text-xs text-slate-400 flex items-center justify-center gap-1 font-bold w-full"><ChevronUp size={11}/> ط¥ط®ظپط§ط،</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center justify-center gap-1 font-bold hover:text-white transition-colors w-full"><ChevronDown size={11}/> ط¹ط±ط¶ ط§ظ„ظ…ظٹط²ط§طھ</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ 104 MODULES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="modules" className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            ًں—‚ï¸ڈ ط§ظ„ظ…ظˆط³ظˆط¹ط© ط§ظ„ظƒط§ظ…ظ„ط©
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4">104 ظˆط­ط¯ط© ط¨ط±ظ…ط¬ظٹط© ظ…طھظƒط§ظ…ظ„ط©</h2>
          
          {/* ط§ظ„ط¨ط­ط« ط§ظ„ط°ظƒظٹ ط§ظ„ط¬ط¯ظٹط¯ */}
          <div className="relative max-w-md mx-auto mt-8 mb-12">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ط§ط¨ط­ط« ط¹ظ† ظ…ظٹط²ط©طŒ ظˆط­ط¯ط©طŒ ط£ظˆ ظˆط¸ظٹظپط©..." 
              className="w-full pr-12 pl-4 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="tab-scroll flex flex-wrap justify-center items-center gap-2 pb-3 mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab===cat.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
              }`}>
              {cat.emoji} {cat.label} {activeTab===cat.id && `(${filteredModules.length})`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center w-full">
                    {filteredModules.map((m) => (
            <div key={m.title} className="group bg-white w-full border border-slate-100 rounded-2xl p-4 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center text-indigo-600 group-hover:text-white mb-3 transition-all duration-300">{m.icon}</div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-700 transition-colors">{m.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed text-center">{m.desc}</p>
            </div>
          ))}
        </div>
        
        {filteredModules.length === 0 && (
          <div className="text-center py-20 w-full">
            <p className="text-slate-400 font-bold">ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ طھط·ط§ط¨ظ‚ ط¨ط­ط«ظƒ ًں”چ</p>
          </div>
        )}
        <div className="text-center mt-8 text-slate-400 text-sm font-bold">
          ط¹ط±ط¶ {filteredModules.length} ظ…ظ† {modulesList.length} ظˆط­ط¯ط©
        </div>
      </section>

      </main>

      {/* â”€â”€ DOWNLOAD SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="download" className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            ًں–¥ï¸ڈ ظ†ط³ط®ط© ط³ط·ط­ ط§ظ„ظ…ظƒطھط¨ â€” Desktop Edition
          </div>
          <h2 className="text-4xl font-black mb-4">ط­ظ…ظ‘ظ„ ظ†ظ…ط§ ط¥ظ†ظپط³طھ ط¹ظ„ظ‰ ط¬ظ‡ط§ط²ظƒ</h2>
          <p className="text-slate-300 text-lg mb-2 max-w-2xl mx-auto">
            ظ†ط³ط®ط© ط³ط·ط­ ط§ظ„ظ…ظƒطھط¨ طھط¹ظ…ظ„ ط¨ط¯ظˆظ† ط¥ظ†طھط±ظ†طھ ظ…ط¹ ظ‚ط§ط¹ط¯ط© ط¨ظٹط§ظ†ط§طھ ظ…ط­ظ„ظٹط© â€” ظ…ط«ط§ظ„ظٹط© ظ„ظ„ظ…ط­ظ„ط§طھ ظˆط§ظ„ظ…ط·ط§ط¹ظ…
          </p>
          <p className="text-slate-400 text-sm mb-10">Windows 10/11 آ· 64-bit آ· طھط­ط¯ظٹط«ط§طھ طھظ„ظ‚ط§ط¦ظٹط©</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: 'ًں”’', title: 'ط£ظ…ط§ظ† ظƒط§ظ…ظ„', desc: 'ط¨ظٹط§ظ†ط§طھظƒ ظ…ط­ظ„ظٹط© ط¹ظ„ظ‰ ط¬ظ‡ط§ط²ظƒ ظپظ‚ط·' },
              { icon: 'ًں“،', title: 'ظٹط¹ظ…ظ„ ط£ظˆظپظ„ط§ظٹظ†', desc: 'ظ„ط§ ط­ط§ط¬ط© ظ„ظ„ط¥ظ†طھط±ظ†طھ ط£ط«ظ†ط§ط، ط§ظ„ط¹ظ…ظ„' },
              { icon: 'ًں”„', title: 'طھط­ط¯ظٹط« طھظ„ظ‚ط§ط¦ظٹ', desc: 'طھط­ط¯ظٹط«ط§طھ ظپظˆط±ظٹط© ط¹ظ†ط¯ طھظˆظپط±ظ‡ط§' },
            ].map(f => (
              <div key={f.title} className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
                <div className="text-3xl mb-2">{f.icon}</div>
                <h3 className="font-black text-base mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
          <a
            href="/updates/desktop/NamaInvest-Setup-2.3.0.exe"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-2xl shadow-2xl shadow-emerald-500/40 transition-all text-xl"
          >
            <Download size={26} />
            طھط­ظ…ظٹظ„ NamaInvest v2.2.1
          </a>
          <p className="text-slate-500 text-xs mt-4">Windows 64-bit Installer آ· ~120MB</p>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-5xl mb-4">ًںڑ€</div>
          <h2 className="text-4xl font-black mb-4">ط¬ط§ظ‡ط² ظ„طھط­ظˆظٹظ„ ط¹ظ…ظ„ظƒ ط±ظ‚ظ…ظٹط§ظ‹طں</h2>
          <p className="text-slate-300 text-lg mb-2 max-w-xl mx-auto">ط§ط¨ط¯ط£ ط§ظ„ظٹظˆظ… ظ…ط¬ط§ظ†ط§ظ‹ ظ…ط¹ ظƒط§ظ…ظ„ ط§ظ„ط¯ط¹ظ… ط§ظ„ظپظ†ظٹ ظˆط§ظ„طھط¯ط±ظٹط¨</p>
          <p className="text-slate-400 text-sm mb-8">Ready to modernize your business? Start free with full support.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pricing" className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-xl shadow-lg transition-all text-lg flex items-center gap-2">
              ًں’ژ ط´ط§ظ‡ط¯ ط§ظ„ط¨ط§ظ‚ط§طھ ظˆط§ظ„ط£ط³ط¹ط§ط±
            </Link>
            <a href="#download" onClick={(e: any) => { e.preventDefault(); document.getElementById('download')?.scrollIntoView({behavior:'smooth'}); }} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl shadow-lg transition-all text-lg flex items-center gap-2">
              <Download className="w-5 h-5"/> طھط­ظ…ظٹظ„ ط§ظ„طھط·ط¨ظٹظ‚
            </a>
            <a href="https://wa.me/966531206628" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all text-lg flex items-center gap-2">
              <Phone className="w-5 h-5"/> طھظˆط§طµظ„ ط¹ط¨ط± ظˆط§طھط³ط§ط¨
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 bg-white border-t border-slate-200 text-center">
        <div className="max-w-7xl mx-auto w-full px-4 flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <Link href="/" className="flex flex-col items-center justify-center gap-2">
               <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center">
                 <Layers className="w-6 h-6 text-white"/>
               </div>
               <div className="text-center">
                 <span className="font-black text-xl text-slate-800">ظ†ظ…ط§ ط¥ظ†ظپط³طھ</span>
                 <span className="text-xs text-slate-400 font-bold block leading-none mt-1">Nama Invest ERP</span>
               </div>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
            <Link href="/pharmacy" className="text-slate-400 hover:text-indigo-600 transition-colors">ط§ظ„طµظٹط¯ظ„ظٹط§طھ</Link>
            <Link href="/retail" className="text-slate-400 hover:text-indigo-600 transition-colors">ط§ظ„طھظ…ظˆظٹظ†ط§طھ</Link>
            <Link href="/restaurant" className="text-slate-400 hover:text-indigo-600 transition-colors">ط§ظ„ظ…ط·ط§ط¹ظ…</Link>
            <Link href="/factory" className="text-slate-400 hover:text-indigo-600 transition-colors">ط§ظ„ظ…طµط§ظ†ط¹</Link>
            <Link href="/pricing" className="text-indigo-500 hover:text-indigo-700 transition-colors font-black">ًں’ژ ط§ظ„ط£ط³ط¹ط§ط±</Link>
            <Link href="/sign-up" className="text-slate-400 hover:text-indigo-600 transition-colors">ط³ط¬ظ‘ظ„ ظ…ط¬ط§ظ†ط§ظ‹</Link>
          </div>
          <div className="text-slate-400 text-sm font-bold w-full text-center border-t border-slate-100 pt-6">آ© {new Date().getFullYear()} ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ‚ ظ…ط­ظپظˆط¸ط© ظ„ط´ط±ظƒط© ظ†ظ…ط§ ط¥ظ†ظپط³طھ</div>
        </div>
      </footer>
    </div>
  );
}
