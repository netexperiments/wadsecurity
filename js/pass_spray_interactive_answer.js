
    function checkAnswer1() {
      const input = document.getElementById('answer1').value.toLowerCase().trim();
      const feedback = document.getElementById('feedback1');

      if (
        (input.includes("Yes") || input.includes("yes")) &&
        (input.includes("account lockout") || input.includes("locking accounts") || input.includes("blocking accounts") || input.includes("locking an account") || input.includes("locking accounts")) &&
        (input.includes("prevent") || input.includes("prevents")) &&
        (input.includes("distribute") || input.includes("sprays") || input.includes("distributing") || input.includes("spraying"))
      ) {
        feedback.innerText = "Good job! You described key parts of the attack.";
        feedback.style.color = "green";
      } else {
        feedback.innerText = "Not quite. Try mentioning how does spraying works differently when compared to bruteforcing, and why it is advantageous/disadvantageous";
        feedback.style.color = "red";
      }
    }