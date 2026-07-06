from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework import routers

from workouts.views import (
    ExerciseViewSet,
    ProgramExerciseViewSet,
    ProgramViewSet,
    SetEntryViewSet,
    WorkoutSessionViewSet,
)

router = routers.DefaultRouter()
router.register("exercises", ExerciseViewSet)
router.register("programs", ProgramViewSet)
router.register("program-exercises", ProgramExerciseViewSet)
router.register("sessions", WorkoutSessionViewSet)
router.register("set-entries", SetEntryViewSet)

urlpatterns = [
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
    ),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/", include(router.urls)),
    path("admin/", admin.site.urls),
]
