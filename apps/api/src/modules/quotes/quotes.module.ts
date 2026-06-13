import { Module } from '@nestjs/common';
import { AwesomeApiAdapter } from './adapters/awesomeapi.adapter';
import { BrapiAdapter } from './adapters/brapi.adapter';
import { CoinGeckoAdapter } from './adapters/coingecko.adapter';
import { FinnhubAdapter } from './adapters/finnhub.adapter';
import { QuoteService } from './quote.service';

@Module({
  providers: [
    QuoteService,
    BrapiAdapter,
    CoinGeckoAdapter,
    FinnhubAdapter,
    AwesomeApiAdapter,
  ],
  exports: [QuoteService],
})
export class QuotesModule {}
