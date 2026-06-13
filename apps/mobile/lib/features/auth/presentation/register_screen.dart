import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../domain/auth_controller.dart';
import '../domain/auth_state.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _loading = true);
    await ref
        .read(authControllerProvider.notifier)
        .register(_emailCtrl.text.trim(), _passwordCtrl.text);
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Criar conta'),
        leading: BackButton(onPressed: () => context.go('/login')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.s6),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                  label: 'Senha (mínimo 8 caracteres)',
                  obscureText: true,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Informe a senha';
                    if (v.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.s4),

                AppTextField(
                  controller: _confirmCtrl,
                  label: 'Confirmar senha',
                  obscureText: true,
                  validator: (v) {
                    if (v != _passwordCtrl.text) return 'As senhas não coincidem';
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
                  label: 'Criar conta',
                  loading: _loading,
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
