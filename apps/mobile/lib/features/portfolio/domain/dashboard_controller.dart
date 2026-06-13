import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/portfolio_repository.dart';
import 'portfolio_models.dart';

// ============================================================================
// DashboardController — carrega o PortfolioSummary via Riverpod AsyncNotifier.
// ============================================================================

class DashboardController
    extends AutoDisposeAsyncNotifier<PortfolioSummary> {
  @override
  Future<PortfolioSummary> build() async {
    return _load();
  }

  Future<PortfolioSummary> _load() async {
    final repo = ref.read(portfolioRepositoryProvider);
    return repo.getSummary();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_load);
  }
}

final portfolioRepositoryProvider = Provider<IPortfolioRepository>(
  (ref) => throw UnimplementedError(
    'portfolioRepositoryProvider must be overridden.',
  ),
);

final dashboardControllerProvider =
    AsyncNotifierProvider.autoDispose<DashboardController, PortfolioSummary>(
  DashboardController.new,
);
