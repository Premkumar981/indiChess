package com.example.matchservice.repo;

import com.example.matchservice.model.Move;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MoveRepo extends JpaRepository<Move, Long> {
}
