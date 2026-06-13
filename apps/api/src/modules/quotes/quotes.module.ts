import { Module } from '@nestjs/common';
import { AwesomeApiAdapter } from './adapters/awesomeapi.adapter';
import { BrapiAdapter } from './adapters/brapi.adapter';
import { CoinGeckoAdapter } from './adapters/coingecko.adapter';
import { FinnhubAdapter } from './adapters/finnhub.adapter';
import { StubQuoteAdapter } from './adapters/stub-quote.adapter';
import { QuoteService } from './quote.service';

/**
 * Quando USE_QUOTE_STUB=true, todos os 4 adapters são substituídos pelo
 * StubQuoteAdapter, que retorna preços fixos determinísticos.
 * Isso garante que testes E2E e CI não dependam de APIs externas.
 */
@Module({
  providers: [
    QuoteService,
    {
      provide: BrapiAdapter,
      useFactory: () =>
        process.env.USE_QUOTE_STUB === 'true'
          ? new StubQuoteAdapter()
          : new BrapiAdapter(),
    },
    {
      provide: CoinGeckoAdapter,
      useFactory: () =>
        process.env.USE_QUOTE_STUB === 'true'
          ? new StubQuoteAdapter()
          : new CoinGeckoAdapter(),
    },
    {
      provide: FinnhubAdapter,
      useFactory: () =>
        process.env.USE_QUOTE_STUB === 'true'
          ? new StubQuoteAdapter()
          : new FinnhubAdapter(),
    },
    {
      provide: AwesomeApiAdapter,
      useFactory: () =>
        process.env.USE_QUOTE_STUB === 'true'
          ? new StubQuoteAdapter()
          : new AwesomeApiAdapter(),
    },
  ],
  exports: [QuoteService],
})
export class QuotesModule {}
