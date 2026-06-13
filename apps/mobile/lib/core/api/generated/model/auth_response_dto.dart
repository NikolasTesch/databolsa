/// Model gerado equivalente ao output do openapi-generator dart-dio.
/// Representa a resposta dos endpoints de auth (/auth/login, /auth/register, /auth/refresh).
/// Campos monetários: nenhum neste modelo.
class AuthResponseDto {
  final String accessToken;
  final String refreshToken;

  const AuthResponseDto({
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) => AuthResponseDto(
        accessToken: json['access_token'] as String,
        refreshToken: json['refresh_token'] as String,
      );

  Map<String, dynamic> toJson() => {
        'access_token': accessToken,
        'refresh_token': refreshToken,
      };
}
