import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import 'transaction_repository.dart';

// ============================================================================
// NewTransactionScreen — formulário BUY/SELL com validação local e erro 422.
// RN-02: SELL maior que posição → API retorna 422 → exibido inline.
// ============================================================================

class NewTransactionScreen extends ConsumerStatefulWidget {
  final String assetId;

  const NewTransactionScreen({super.key, required this.assetId});

  @override
  ConsumerState<NewTransactionScreen> createState() =>
      _NewTransactionScreenState();
}

class _NewTransactionScreenState
    extends ConsumerState<NewTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _unitPriceCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _feesCtrl = TextEditingController();
  final _dateCtrl = TextEditingController();

  String _type = 'BUY';
  bool _loading = false;
  String? _apiError;

  @override
  void initState() {
    super.initState();
    _dateCtrl.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
  }

  @override
  void dispose() {
    _unitPriceCtrl.dispose();
    _quantityCtrl.dispose();
    _feesCtrl.dispose();
    _dateCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _apiError = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _loading = true);
    try {
      final unitPrice = Decimal.parse(_unitPriceCtrl.text.trim());
      final quantity = Decimal.parse(_quantityCtrl.text.trim());
      final feesStr = _feesCtrl.text.trim();
      final fees = feesStr.isNotEmpty ? Decimal.parse(feesStr) : null;

      await ref.read(transactionRepositoryProvider).create(
            assetId: widget.assetId,
            type: _type,
            date: _dateCtrl.text.trim(),
            unitPrice: unitPrice,
            quantity: quantity,
            fees: fees,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Transação registrada com sucesso!')),
        );
        context.go('/assets/${widget.assetId}');
      }
    } on ApiException catch (e) {
      setState(() => _apiError = e.message);
    } catch (e) {
      setState(() => _apiError = 'Erro inesperado. Tente novamente.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.tryParse(_dateCtrl.text) ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      _dateCtrl.text = DateFormat('yyyy-MM-dd').format(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Nova transação')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.s6),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Tipo BUY/SELL
                Row(
                  children: [
                    Expanded(
                      child: _TypeButton(
                        label: 'COMPRA',
                        selected: _type == 'BUY',
                        color: scheme.profit,
                        onTap: () => setState(() => _type = 'BUY'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.s3),
                    Expanded(
                      child: _TypeButton(
                        label: 'VENDA',
                        selected: _type == 'SELL',
                        color: scheme.loss,
                        onTap: () => setState(() => _type = 'SELL'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s4),

                // Data
                TextFormField(
                  controller: _dateCtrl,
                  readOnly: true,
                  onTap: _pickDate,
                  decoration: const InputDecoration(
                    labelText: 'Data',
                    suffixIcon: Icon(Icons.calendar_today),
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Informe a data' : null,
                ),
                const SizedBox(height: AppSpacing.s4),

                AppTextField(
                  controller: _unitPriceCtrl,
                  label: 'Preço unitário (R\$)',
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Informe o preço';
                    }
                    try {
                      final d = Decimal.parse(v.trim());
                      if (d <= Decimal.zero) return 'O preço deve ser positivo';
                    } catch (_) {
                      return 'Número inválido';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.s4),

                AppTextField(
                  controller: _quantityCtrl,
                  label: 'Quantidade',
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Informe a quantidade';
                    }
                    try {
                      final d = Decimal.parse(v.trim());
                      if (d <= Decimal.zero) {
                        return 'A quantidade deve ser positiva';
                      }
                    } catch (_) {
                      return 'Número inválido';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.s4),

                AppTextField(
                  controller: _feesCtrl,
                  label: 'Taxas (opcional)',
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return null;
                    try {
                      final d = Decimal.parse(v.trim());
                      if (d < Decimal.zero) return 'Taxas não podem ser negativas';
                    } catch (_) {
                      return 'Número inválido';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.s4),

                // Erro da API (ex: 422 SELL maior que posição)
                if (_apiError != null)
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.s3),
                    margin: const EdgeInsets.only(bottom: AppSpacing.s4),
                    decoration: BoxDecoration(
                      color: scheme.danger.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: scheme.danger),
                    ),
                    child: Text(
                      _apiError!,
                      style: TextStyle(
                        color: scheme.danger,
                        fontSize: AppFontSize.sm,
                      ),
                    ),
                  ),

                PrimaryButton(
                  label: _type == 'BUY' ? 'Registrar compra' : 'Registrar venda',
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

class _TypeButton extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _TypeButton({
    required this.label,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.s3),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: selected ? color : Colors.grey.withOpacity(0.3),
            width: selected ? 2 : 1,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? color : Colors.grey,
              fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              fontSize: AppFontSize.sm,
            ),
          ),
        ),
      ),
    );
  }
}
