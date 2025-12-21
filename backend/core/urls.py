from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'songs', views.SongViewSet, basename='song')

urlpatterns = router.urls + [
    path('', views.api_root, name='api-root'),
    path('presentation/state/', views.PresentationStateView.as_view(), name='presentation-state'),
    path('presentation/output/', views.PresentationOutputView.as_view(), name='presentation-output'),
    path('presentation/stage/', views.PresentationStageView.as_view(), name='presentation-stage'),
    # Bible endpoints
    path('bible/versions/', views.BibleVersionsView.as_view(), name='bible-versions'),
    path('bible/books/', views.BibleBooksView.as_view(), name='bible-books'),
    path('bible/passage/', views.BiblePassageView.as_view(), name='bible-passage'),
    path('bible/slide/', views.BibleSlideCreateView.as_view(), name='bible-slide-create'),
]

