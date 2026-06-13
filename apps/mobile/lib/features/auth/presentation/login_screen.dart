import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../domain/auth_controller.dart';
import '../domain/auth_state.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _loading = true);
    await ref
        .read(authControllerProvider.notifier)
        .login(_emailCtrl.text.trim(), _passwordCtrl.text);
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.s6),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'DataBolsa',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: AppFontSize.s3xl,
                      fontWeight: FontWeight.bold,
                      color: scheme.primary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s2),
                  Text(
                    'Acompanhe seu portfólio',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: AppFontSize.base,
                      color: scheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s8),

                  AppTextField(
                    controller: _emailCtrl,
                    label: 'E-mail',
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Informe o e-mail';
                      if (!v.contains('@')) return 'E-mail inválido';
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.s4),

                  AppTextField(
                    controller: _passwordCtrl,
                    label: 'Senha',
                    obscureText: true,
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Informe a senha';
                      return null;
                    },
                  ),
                  const SizedBox(height: AppSpacing.s2),

                  if (authState.status == AuthStatus.unauthenticated &&
                      authState.error != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.s2),
                      child: Text(
                        authState.error!,
                        style: TextStyle(color: scheme.danger, fontSize: AppFontSize.sm),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  const SizedBox(height: AppSpacing.s4),
                  PrimaryButton(
                    label: 'Entrar',
                    loading: _loading,
                    onPressed: _submit,
                  ),
                  const SizedBox(height: AppSpacing.s4),

                  TextButton(
                    onPressed: () => context.go('/register'),
                    child: Text(
                      'Criar conta',
                      style: TextStyle(color: scheme.primary),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
