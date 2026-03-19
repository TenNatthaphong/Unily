"use client";
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppSidebar } from "./components/app-sidebar";
import { AdminDashboard } from "./components/admin-dashboard";
import { AdminUsers } from "./components/admin-users";
import { AdminCourses } from "./components/admin-courses";
import { AdminCurricula } from "./components/admin-curricula";
import { AdminCalendar } from "./components/admin-calendar";
import AdminManageCurriculum from "./components/AdminManageCurriculum";
import { AuthProvider } from "./components/auth-context";
import { ThemeProvider } from "@/components/ui/theme-provider";

export default function AdminSPA() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={<AppSidebar role="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="curricula" element={<AdminCurricula />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="curricula/:id" element={<AdminManageCurriculum />} />
            </Route>
            {/* Fallback to login or home */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
