from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'songs', views.SongViewSet, basename='song')

urlpatterns = router.urls + [
    path('', views.api_root, name='api-root'),
]

