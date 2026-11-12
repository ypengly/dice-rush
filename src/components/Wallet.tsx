import { useCountUp } from '../hooks/useCountUp';
import { useWallet } from '../hooks/useWallet';
import { formatCoins } from '../utils/formatCoins';

export default function Wallet() {
  const { balance, canClaim, dailyBonus, claimBonus } = useWallet();
  const shown = useCountUp(balance);

  return (
    <div className="wallet">
      <div className="wallet-balance" title="Virtual coins – no real money">
        <span className="coin-icon" aria-hidden="true">●</span>
        <span className="wallet-amount" data-testid="balance">{formatCoins(shown)}</span>
        <span className="wallet-unit">coins</span>
      </div>
      {canClaim && (
        <button type="button" className="btn btn-bonus" onClick={claimBonus}>
          🎁 Daily +{dailyBonus}
        </button>
      )}
    </div>
  );
}
