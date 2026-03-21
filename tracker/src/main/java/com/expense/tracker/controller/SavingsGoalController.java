package com.expense.tracker.controller;

import com.expense.tracker.model.SavingsGoal;
import com.expense.tracker.repository.SavingsGoalRepository;
import com.expense.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/savings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class SavingsGoalController {

    private final SavingsGoalRepository goalRepo;
    private final UserRepository userRepo;

    @GetMapping
    public List<SavingsGoal> getAll(Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        return goalRepo.findByUserId(user.getId());
    }

    @PostMapping
    public SavingsGoal create(@RequestBody SavingsGoal goal, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        goal.setUser(user);
        return goalRepo.save(goal);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavingsGoal> update(@PathVariable Long id,
                                              @RequestBody SavingsGoal updated, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        return goalRepo.findById(id)
                .filter(g -> g.getUser().getId().equals(user.getId()))
                .map(g -> {
                    g.setName(updated.getName());
                    g.setTargetAmount(updated.getTargetAmount());
                    g.setCurrentAmount(updated.getCurrentAmount());
                    g.setTargetDate(updated.getTargetDate());
                    return ResponseEntity.ok(goalRepo.save(g));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        var user = userRepo.findByEmail(auth.getName()).orElseThrow();
        return goalRepo.findById(id)
                .filter(g -> g.getUser().getId().equals(user.getId()))
                .map(g -> {
                    goalRepo.delete(g);
                    return ResponseEntity.ok().<Void>build();
                }).orElse(ResponseEntity.notFound().build());
    }
}