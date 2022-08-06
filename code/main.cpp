// prime sieve
#include <iostream>
#include <vector>
using namespace std;
 
void sieveoferatosthenes(int n) {
    vector<bool> prime(n + 1, true);
 	// WHY DOESN'T IT WORK??
    for (int p = 2; p * p <= n; ++p) {
        if (prime[p]) {
          	cout << p << ' ' << endl;
            for (int i = p * 2; i <= n; i += p) prime[i] = false;
        }
    }
    for (int p = 2; p<=n; p++) {
       if (prime[p]) cout << p << " ";
    }
}

int main()
{
    int n = 100;
    sieveoferatosthenes(n);
    return 0;
}
