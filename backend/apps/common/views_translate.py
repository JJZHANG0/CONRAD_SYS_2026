from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.teams.permissions import user_is_operations

from .translate import translate_en_to_zh


class TranslateView(APIView):
    """Operations-only: translate module text from English to Chinese."""

    def post(self, request):
        if not user_is_operations(request.user):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        text = request.data.get("text", "")
        if not isinstance(text, str):
            return Response({"detail": "text must be a string."}, status=status.HTTP_400_BAD_REQUEST)
        if not text.strip():
            return Response({"detail": "text is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(text) > 20000:
            return Response(
                {"detail": "text is too long (max 20000 characters)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            translated = translate_en_to_zh(text)
        except RuntimeError as exc:
            return Response(
                {
                    "detail": (
                        str(exc)
                        if "所有翻译服务" in str(exc)
                        else f"翻译服务暂时不可用，请确认浏览器可访问外网或配置百度翻译 API。 ({exc})"
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"translated": translated, "source_lang": "en", "target_lang": "zh-CN"})
