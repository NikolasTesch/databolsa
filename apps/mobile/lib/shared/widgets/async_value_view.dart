import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Widget genérico para exibir loading/error/data de um AsyncValue.
class AsyncValueView<T> extends StatelessWidget {
  final AsyncValue<T> value;
  final Widget Function(T data) builder;
  final Widget? loadingWidget;
  final Widget Function(Object error, StackTrace? stack)? errorBuilder;

  const AsyncValueView({
    super.key,
    required this.value,
    required this.builder,
    this.loadingWidget,
    this.errorBuilder,
  });

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: builder,
      loading: () => loadingWidget ?? const Center(child: CircularProgressIndicator()),
      error: (error, stack) =>
          errorBuilder?.call(error, stack) ??
          Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                error.toString(),
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ),
    );
  }
}
