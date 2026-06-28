from rest_framework import permissions


def user_can_access_portfolio(user, portfolio):
    if not user.is_authenticated:
        return False
    if user.is_admin_user or user.is_superuser:
        return True
    if user.is_student and portfolio.owner_id == user.id:
        return True
    if user.is_teacher and portfolio.assigned_teacher_id == user.id:
        return True
    return False


def user_can_edit_portfolio(user, portfolio):
    if not user.is_authenticated:
        return False
    if user.is_admin_user:
        return True
    if user.is_student and portfolio.owner_id == user.id:
        return True
    return False


class PortfolioAccessPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return user_can_access_portfolio(request.user, obj)


class PortfolioEditPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return user_can_access_portfolio(request.user, obj)
        return user_can_edit_portfolio(request.user, obj)
