import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/money/money.dart';
import '../../../../core/theme/app_tokens.dart';
import '../../../../core/theme/app_theme.dart';

class PatrimonioHeader extends StatelessWidget {
  final Decimal patrimonio;

  const PatrimonioHeader({super.key, required this.patrimonio});

  @override
  Widget build(BuildContext context) {
    final scheme = context.appScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.s6),
      decoration: BoxDecoration(
        color: scheme.primary,
        borderRadius: BorderRadius.circular(AppRadius.xl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Patrimônio total',
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: AppFontSize.sm,
            ),
          ),
          const SizedBox(height: AppSpacing.s2),
          Text(
            formatBrl(patrimonio),
            style: GoogleFonts.ibmPlexMono(
              color: Colors.white,
              fontSize: AppFontSize.s3xl,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
